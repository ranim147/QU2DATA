import math
from numbers import Real
from typing import Literal

import pandas as pd
from fastapi import HTTPException

from schemas.row_filter_schema import FilterCondition, SortRule


NUMERIC_OPERATORS = {
    "=",
    "!=",
    ">",
    ">=",
    "<",
    "<=",
    "between",
    "is_null",
    "is_not_null"
}

TEXT_OPERATORS = {
    "=",
    "!=",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "in",
    "is_null",
    "is_not_null"
}

NULL_OPERATORS = {"is_null", "is_not_null"}


def _is_numeric_series(series: pd.Series) -> bool:
    return (
        pd.api.types.is_numeric_dtype(series)
        and not pd.api.types.is_bool_dtype(series)
    )


def _is_text_series(series: pd.Series) -> bool:
    return (
        pd.api.types.is_object_dtype(series)
        or pd.api.types.is_string_dtype(series)
        or isinstance(series.dtype, pd.CategoricalDtype)
        or pd.api.types.is_bool_dtype(series)
    )


def _validate_columns_exist(
    df: pd.DataFrame,
    columns: list[str]
) -> None:
    unknown_columns = [
        column
        for column in columns
        if column not in df.columns
    ]

    if unknown_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown columns: {unknown_columns}"
        )


def _validate_numeric_value(value: object, operator: str) -> None:
    if operator == "between":
        if not isinstance(value, list) or len(value) != 2:
            raise HTTPException(
                status_code=400,
                detail="Operator 'between' requires a list with exactly 2 values"
            )
        values = value
    else:
        values = [value]

    if any(
        isinstance(item, bool)
        or not isinstance(item, Real)
        or not math.isfinite(item)
        for item in values
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Operator '{operator}' requires numeric value(s)"
        )


def validate_filter_condition(
    df: pd.DataFrame,
    condition: FilterCondition
) -> None:
    _validate_columns_exist(df, [condition.column])

    if condition.operator in NULL_OPERATORS:
        return

    series = df[condition.column]

    if _is_numeric_series(series):
        if condition.operator not in NUMERIC_OPERATORS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Operator '{condition.operator}' is not valid for "
                    f"numeric column '{condition.column}'"
                )
            )
        _validate_numeric_value(condition.value, condition.operator)
        return

    if _is_text_series(series):
        if condition.operator not in TEXT_OPERATORS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Operator '{condition.operator}' is not valid for "
                    f"text column '{condition.column}'"
                )
            )

        if condition.operator == "in":
            if (
                not isinstance(condition.value, list)
                or not condition.value
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Operator 'in' requires a non-empty list of values"
                )
        elif condition.operator in {
            "contains",
            "not_contains",
            "starts_with",
            "ends_with"
        } and not isinstance(condition.value, str):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Operator '{condition.operator}' requires a text value"
                )
            )
        elif condition.value is None:
            raise HTTPException(
                status_code=400,
                detail=f"Operator '{condition.operator}' requires a value"
            )
        return

    raise HTTPException(
        status_code=400,
        detail=(
            f"Column '{condition.column}' has unsupported dtype "
            f"'{series.dtype}'"
        )
    )


def apply_single_condition(
    df: pd.DataFrame,
    condition: FilterCondition
) -> pd.Series:
    validate_filter_condition(df, condition)

    series = df[condition.column]
    operator = condition.operator
    value = condition.value

    if operator == "is_null":
        return series.isnull()
    if operator == "is_not_null":
        return series.notna()

    not_null = series.notna()

    if operator == "=":
        return not_null & series.eq(value)
    if operator == "!=":
        return not_null & series.ne(value)
    if operator == ">":
        return not_null & series.gt(value)
    if operator == ">=":
        return not_null & series.ge(value)
    if operator == "<":
        return not_null & series.lt(value)
    if operator == "<=":
        return not_null & series.le(value)
    if operator == "between":
        lower, upper = value
        if lower > upper:
            raise HTTPException(
                status_code=400,
                detail="Operator 'between' requires lower value <= upper value"
            )
        return not_null & series.between(lower, upper, inclusive="both")

    text_series = series.astype("string")
    text_value = str(value)

    if operator == "contains":
        return text_series.str.contains(
            text_value,
            regex=False,
            na=False
        )
    if operator == "not_contains":
        return not_null & ~text_series.str.contains(
            text_value,
            regex=False,
            na=False
        )
    if operator == "starts_with":
        return text_series.str.startswith(text_value, na=False)
    if operator == "ends_with":
        return text_series.str.endswith(text_value, na=False)
    if operator == "in":
        return not_null & series.isin(value)

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported filter operator: {operator}"
    )


def apply_row_filters(
    df: pd.DataFrame,
    conditions: list[FilterCondition],
    logic: Literal["AND", "OR"] = "AND"
) -> pd.DataFrame:
    if not conditions:
        return df.copy()

    masks = [
        apply_single_condition(df, condition)
        for condition in conditions
    ]
    combined_mask = masks[0]

    for mask in masks[1:]:
        combined_mask = (
            combined_mask & mask
            if logic == "AND"
            else combined_mask | mask
        )

    return df.loc[combined_mask].copy().reset_index(drop=True)


def validate_sort_columns(
    df: pd.DataFrame,
    sort_by: list[SortRule]
) -> None:
    _validate_columns_exist(
        df,
        [rule.column for rule in sort_by]
    )


def apply_sort(
    df: pd.DataFrame,
    sort_by: list[SortRule]
) -> pd.DataFrame:
    if not sort_by:
        return df.copy()

    validate_sort_columns(df, sort_by)
    try:
        return df.sort_values(
            by=[rule.column for rule in sort_by],
            ascending=[rule.direction == "asc" for rule in sort_by],
            na_position="last",
            kind="mergesort"
        ).reset_index(drop=True)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Rows could not be sorted: {str(exc)}"
        ) from exc


def paginate_dataframe(
    df: pd.DataFrame,
    page: int,
    page_size: int
) -> tuple[pd.DataFrame, int]:
    total_pages = math.ceil(len(df) / page_size) if len(df) else 0
    start = (page - 1) * page_size
    end = start + page_size
    return df.iloc[start:end].copy().reset_index(drop=True), total_pages
