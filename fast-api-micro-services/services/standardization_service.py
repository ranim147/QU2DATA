from typing import Any, Optional

import numpy as np
import pandas as pd
from fastapi import HTTPException


StandardizationResult = tuple[
    pd.DataFrame,
    list[dict[str, Any]],
    list[dict[str, Any]]
]


def _to_json_value(value: Any) -> Optional[float]:
    if pd.isna(value):
        return None
    return round(float(value), 6)


def _stats_before(series: pd.Series) -> dict[str, Optional[float]]:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)

    return {
        "mean": _to_json_value(series.mean()),
        "std": _to_json_value(series.std()),
        "min": _to_json_value(series.min()),
        "max": _to_json_value(series.max()),
        "median": _to_json_value(series.median()),
        "q1": _to_json_value(q1),
        "q3": _to_json_value(q3),
        "iqr": _to_json_value(q3 - q1)
    }


def _stats_after(series: pd.Series) -> dict[str, Optional[float]]:
    return {
        "mean": _to_json_value(series.mean()),
        "std": _to_json_value(series.std()),
        "min": _to_json_value(series.min()),
        "max": _to_json_value(series.max()),
        "median": _to_json_value(series.median())
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
                detail=(
                    f"Column '{column}' contains no non-missing numeric values"
                )
            )

    return cleaned_columns


def _standardize_series(
    series: pd.Series,
    column: str,
    method: str
) -> pd.Series:
    if method == "z_score":
        denominator = series.std()
        if pd.isna(denominator) or np.isclose(denominator, 0):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot standardize column '{column}' because std is 0"
            )
        return (series - series.mean()) / denominator

    if method == "min_max":
        minimum = series.min()
        maximum = series.max()
        denominator = maximum - minimum
        if pd.isna(denominator) or np.isclose(denominator, 0):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot standardize column '{column}' because max equals min"
                )
            )
        return (series - minimum) / denominator

    if method == "robust":
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        denominator = q3 - q1
        if pd.isna(denominator) or np.isclose(denominator, 0):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot standardize column '{column}' because IQR is 0"
            )
        return (series - series.median()) / denominator

    raise HTTPException(
        status_code=400,
        detail="Invalid standardization method"
    )


def apply_standardization(
    df: pd.DataFrame,
    columns: list[str],
    method: str,
    preview_limit: int = 10
) -> StandardizationResult:
    result_df = df.copy()
    print(df.columns.tolist())
    target_columns = _validate_columns(result_df, columns)
    results = []

    for column in target_columns:
        original_series = result_df[column]
        stats_before = _stats_before(original_series)
        standardized = _standardize_series(
            original_series,
            column,
            method
        )
        result_df[column] = standardized

        results.append(
            {
                "column": column,
                "stats_before": stats_before,
                "stats_after": _stats_after(standardized)
            }
        )

    return (
        result_df,
        results,
        _records_from_dataframe(result_df, preview_limit)
    )
