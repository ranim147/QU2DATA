from typing import Any, Optional

import numpy as np
import pandas as pd
from fastapi import HTTPException


def _to_json_value(value: Any) -> Optional[float]:
    if pd.isna(value):
        return None
    return round(float(value), 6)


def _stats(series: pd.Series) -> dict[str, Optional[float]]:
    return {
        "min": _to_json_value(series.min()),
        "max": _to_json_value(series.max()),
        "mean": _to_json_value(series.mean()),
        "std": _to_json_value(series.std())
    }


def _records_from_dataframe(
    df: pd.DataFrame,
    limit: int
) -> list[dict[str, Any]]:
    preview_df = df.head(limit)
    cleaned_df = preview_df.astype(object).where(pd.notna(preview_df), None)
    return cleaned_df.to_dict(orient="records")


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
        if pd.api.types.is_bool_dtype(df[column]):
            raise HTTPException(
                status_code=400,
                detail=f"Column '{column}' must be numeric and cannot be boolean"
            )

        if not pd.api.types.is_numeric_dtype(df[column]):
            raise HTTPException(
                status_code=400,
                detail=f"Column '{column}' must be numeric"
            )

        if df[column].dropna().empty:
            raise HTTPException(
                status_code=400,
                detail=f"Column '{column}' contains no non-missing numeric values"
            )

    return cleaned_columns


def apply_normalization(
    df: pd.DataFrame,
    columns: list[str],
    preview_limit: int = 10
) -> tuple[pd.DataFrame, list[dict[str, Any]], list[dict[str, Any]]]:
    result_df = df.copy()
    target_columns = _validate_columns(result_df, columns)
    results = []

    for column in target_columns:
        series = result_df[column]
        minimum = series.min()
        maximum = series.max()
        denominator = maximum - minimum

        if pd.isna(denominator) or np.isclose(denominator, 0):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot normalize column '{column}' because max equals min"
            )

        normalized = (series - minimum) / denominator
        result_df[column] = normalized
        results.append(
            {
                "column": column,
                "stats_before": _stats(series),
                "stats_after": _stats(normalized)
            }
        )

    return (
        result_df,
        results,
        _records_from_dataframe(result_df, preview_limit)
    )
