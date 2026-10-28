import math
from typing import Any

import numpy as np
import pandas as pd
from fastapi import HTTPException
from services.file_parser_service import clean_dataframe_for_json


# ─── Utilitaires ────────────────────────────────────────────

def safe_preview(df: pd.DataFrame) -> list:
    return dataframe_to_records(df.head(5))


def marge_erreur(n: int) -> float:
    if n <= 0:
        return 0.0
    return round(1.96 * math.sqrt(0.25 / n), 4)


# ─── Stratifié ──────────────────────────────────────────────

def stratified_sample(
    df: pd.DataFrame,
    strate_col: str,
    n: int = None,
    mode: str = "proportionnel"
) -> dict:
    if strate_col not in df.columns:
        return {"error": f"Colonne introuvable : {strate_col}"}

    total = len(df)
    modalites = df[strate_col].dropna().unique().tolist()
    frames = []

    for modalite in modalites:
        groupe = df[df[strate_col] == modalite]

        if mode == "proportionnel":
            taille = max(1, round(len(groupe) / total * n)) if n else len(groupe)
        else:  # equilibre
            taille = max(1, n // len(modalites)) if n else len(groupe)

        taille = min(taille, len(groupe))
        frames.append(groupe.sample(n=taille, random_state=42))

    result = pd.concat(frames, ignore_index=True) if frames else df.head(0).copy()

    return {
        "method": "stratifié",
        "strate_col": strate_col,
        "mode": mode,
        "modalites": len(modalites),
        "rows_original": total,
        "rows_sampled": len(result),
        "marge_erreur": marge_erreur(len(result)),
        "niveau_confiance": "95%",
        "preview": safe_preview(result),
        "df": result
    }


def bootstrap_sample(df: pd.DataFrame, n: int) -> dict:
    if n <= 0:
        return {"error": "n doit être supérieur à 0"}

    total = len(df)
    indices = np.random.choice(total, size=n, replace=True)
    result = df.iloc[indices.tolist()].reset_index(drop=True)

    return {
        "method": "bootstrap",
        "rows_original": total,
        "rows_sampled": len(result),
        "marge_erreur": marge_erreur(len(result)),
        "niveau_confiance": "95%",
        "preview": safe_preview(result),
        "df": result
    }

def resolve_sample_size(
    total_rows: int,
    size: float,
    size_mode: str
) -> int:
    if total_rows <= 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot sample an empty dataframe"
        )
    if size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Sample size must be greater than 0"
        )

    if size_mode == "n":
        sample_size = int(size)
    elif size_mode == "percent":
        if size > 100:
            raise HTTPException(
                status_code=400,
                detail="Percentage size must be between 0 and 100"
            )
        sample_size = math.ceil(total_rows * size / 100)
    elif size_mode == "k":
        k = int(size)
        if k < 1:
            raise HTTPException(
                status_code=400,
                detail="Systematic interval k must be at least 1"
            )
        if k > total_rows:
            raise HTTPException(
                status_code=400,
                detail="Systematic interval k cannot exceed total rows"
            )
        sample_size = math.ceil(total_rows / k)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported size mode: {size_mode}"
        )

    if sample_size < 1 or sample_size > total_rows:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Sample size must be between 1 and {total_rows}"
            )
        )

    return sample_size


def simple_random_sample(df: pd.DataFrame, size: float, size_mode: str, seed: int):
    sample_size = resolve_sample_size(len(df), size, size_mode)

    sampled_df = df.sample(
        n=sample_size,
        random_state=seed
    ).reset_index(drop=True)

    selected_indices = list(range(len(sampled_df)))

    return sampled_df, selected_indices




def systematic_sample(
    df: pd.DataFrame,
    size: float,
    size_mode: str,
    seed: int
) -> tuple[pd.DataFrame, list[int], int, int]:
    total_rows = len(df)

    if size_mode == "k":
        sample_size = resolve_sample_size(total_rows, size, size_mode)
        k = int(size)
    else:
        sample_size = resolve_sample_size(total_rows, size, size_mode)
        k = max(total_rows // sample_size, 1)

    rng = np.random.default_rng(seed)
    offset = int(rng.integers(0, k))
    selected_indices = list(range(offset, total_rows, k))

    if len(selected_indices) > sample_size:
        selected_indices = selected_indices[:sample_size]

    sampled_df = df.iloc[selected_indices]
    return sampled_df, selected_indices, k, offset


def quota_sample(
    df: pd.DataFrame,
    quota_columns: list[str],
    quotas: list,
    seed: int,
    allow_underfilled: bool = False
) -> tuple[pd.DataFrame, list[int], list[dict[str, Any]]]:
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="Cannot sample an empty dataframe"
        )

    missing_columns = [
        column for column in quota_columns
        if column not in df.columns
    ]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                "Quota columns not found in dataframe: "
                f"{missing_columns}"
            )
        )

    selected_index_set = set()
    selected_indices = []
    quota_results = []

    for cell_index, quota in enumerate(quotas):
        cell = (
            quota.model_dump()
            if hasattr(quota, "model_dump")
            else quota
        )
        values = cell.get("values", {})
        target = cell.get("target")

        if not values:
            raise HTTPException(
                status_code=400,
                detail=f"Quota values cannot be empty for cell {cell_index}"
            )
        if not isinstance(target, int) or target <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Quota target must be greater than 0 for {values}"
            )

        invalid_keys = [
            key for key in values
            if key not in quota_columns
        ]
        if invalid_keys:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid quota values keys {invalid_keys}. "
                    f"Expected keys from {quota_columns}"
                )
            )

        mask = pd.Series(True, index=df.index)
        try:
            for column, value in values.items():
                if pd.isna(value):
                    mask &= df[column].isnull()
                else:
                    mask &= df[column].eq(value)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quota values for {values}"
            )

        matching_df = df.loc[mask]
        matching_indices = set(matching_df.index.tolist())
        overlapping_indices = matching_indices & selected_index_set
        if overlapping_indices:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Overlapping quota cells would produce duplicate rows "
                    f"for {values}"
                )
            )

        available = len(matching_df)
        if available < target and not allow_underfilled:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Quota cannot be satisfied for {values}. "
                    f"Requested {target}, available {available}"
                )
            )

        selected_count = min(target, available)
        if selected_count == available:
            selected_df = matching_df
        else:
            selected_df = matching_df.sample(
                n=selected_count,
                random_state=seed + cell_index
            )

        cell_indices = selected_df.index.tolist()
        duplicate_indices = set(cell_indices) & selected_index_set
        if duplicate_indices:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Overlapping quota cells produced duplicate rows "
                    f"for {values}"
                )
            )

        selected_indices.extend(cell_indices)
        selected_index_set.update(cell_indices)
        quota_results.append({
            "values": values,
            "requested": target,
            "available": available,
            "selected": selected_count,
            "underfilled": selected_count < target
        })

    sampled_df = df.loc[selected_indices].sort_index()
    sorted_indices = [int(index) for index in sampled_df.index]
    return sampled_df, sorted_indices, quota_results


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    cleaned_df = clean_dataframe_for_json(df.copy())
    return cleaned_df.to_dict(orient="records")
