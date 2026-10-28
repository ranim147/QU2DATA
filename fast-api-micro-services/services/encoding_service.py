import re
from typing import Any

import pandas as pd
from fastapi import HTTPException


MAX_NUMERIC_CATEGORIES = 20


def _records_from_dataframe(
    df: pd.DataFrame,
    limit: int
) -> list[dict[str, Any]]:
    preview_df = df.head(limit)
    cleaned_df = preview_df.astype(object).where(pd.notna(preview_df), None)
    return cleaned_df.to_dict(orient="records")


def _clean_name(value: Any) -> str:
    text = str(value).strip()
    text = re.sub(r"\s+", "_", text)
    text = re.sub(r"[^0-9A-Za-z_]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text or "empty"


def _validate_columns(df: pd.DataFrame, columns: list[str]) -> list[str]:
    if not columns:
        raise HTTPException(
            status_code=400,
            detail="columns cannot be empty"
        )

    cleaned_columns = []
    for column in columns:
        cleaned_column = column.strip()
        if not cleaned_column:
            raise HTTPException(
                status_code=400,
                detail="columns cannot contain empty names"
            )
        cleaned_columns.append(cleaned_column)

    if len(set(cleaned_columns)) != len(cleaned_columns):
        raise HTTPException(
            status_code=400,
            detail="columns cannot contain duplicates"
        )

    unknown_columns = [
        column for column in cleaned_columns if column not in df.columns
    ]
    if unknown_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown columns: {unknown_columns}"
        )

    for column in cleaned_columns:
        series = df[column]
        if series.dropna().empty:
            raise HTTPException(
                status_code=400,
                detail=f"Column '{column}' is empty"
            )

        if pd.api.types.is_numeric_dtype(series) and not (
            pd.api.types.is_bool_dtype(series)
        ):
            unique_count = series.dropna().nunique()
            if unique_count > MAX_NUMERIC_CATEGORIES:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Column '{column}' appears numeric and continuous. "
                        "One-hot encoding is intended for categorical columns."
                    )
                )

    return cleaned_columns


def _unique_new_column_name(
    existing_columns: set[str],
    preferred_name: str
) -> str:
    candidate = preferred_name
    suffix = 1

    while candidate in existing_columns:
        suffix += 1
        candidate = f"{preferred_name}_{suffix}"

    existing_columns.add(candidate)
    return candidate


def apply_one_hot_encoding(
    df: pd.DataFrame,
    columns: list[str],
    drop_first: bool = False,
    drop_original: bool = True,
    preview_limit: int = 10
) -> tuple[pd.DataFrame, dict[str, list[str]], list[dict[str, Any]]]:
    result_df = df.copy()
    target_columns = _validate_columns(result_df, columns)
    created_columns: dict[str, list[str]] = {}
    existing_columns = set(result_df.columns)

    for column in target_columns:
        series = result_df[column]
        categories = sorted(series.dropna().unique(), key=lambda value: str(value))
        if drop_first:
            categories = categories[1:]

        created_columns[column] = []
        for category in categories:
            new_column = _unique_new_column_name(
                existing_columns,
                f"{_clean_name(column)}_{_clean_name(category)}"
            )
            result_df[new_column] = (
                series.eq(category).where(series.notna(), False).astype(int)
            )
            created_columns[column].append(new_column)

    if drop_original:
        result_df = result_df.drop(columns=target_columns)

    return (
        result_df,
        created_columns,
        _records_from_dataframe(result_df, preview_limit)
    )
