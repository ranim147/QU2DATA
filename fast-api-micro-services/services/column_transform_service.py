import ast
import operator
from typing import Any, Literal, Optional

import numpy as np
import pandas as pd
from fastapi import HTTPException

from schemas.column_transform_schema import BinningRule


ColumnTransformOperation = Literal[
    "concat",
    "calculate",
    "recode",
    "binning"
]

ALLOWED_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod
}

ALLOWED_UNARY_OPERATORS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg
}

MAX_FORMULA_LENGTH = 1000
MAX_FORMULA_NODES = 200


def validate_columns_exist(df: pd.DataFrame, columns: list[str]) -> None:
    unknown_columns = [column for column in columns if column not in df.columns]

    if unknown_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown columns: {unknown_columns}"
        )


def _validate_new_column(
    df: pd.DataFrame,
    new_column: str,
    overwrite: bool
) -> None:
    if not new_column or not new_column.strip():
        raise HTTPException(
            status_code=400,
            detail="new_column is required"
        )

    if new_column in df.columns and not overwrite:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Column '{new_column}' already exists. "
                "Set overwrite=true to replace it."
            )
        )


def _drop_original_columns(
    df: pd.DataFrame,
    source_columns: list[str],
    new_column: str,
    keep_original: bool
) -> pd.DataFrame:
    if keep_original:
        return df

    columns_to_drop = [
        column
        for column in source_columns
        if column != new_column and column in df.columns
    ]
    return df.drop(columns=list(dict.fromkeys(columns_to_drop)))


def concat_columns(
    df: pd.DataFrame,
    columns: list[str],
    new_column: str,
    separator: str = "-",
    keep_original: bool = True
) -> pd.DataFrame:
    if len(columns) < 2:
        raise HTTPException(
            status_code=400,
            detail="concat requires at least 2 columns"
        )

    validate_columns_exist(df, columns)

    missing_mask = df[columns].isnull().any(axis=1)
    concatenated = df[columns].apply(
        lambda row: separator.join(str(value) for value in row),
        axis=1
    )
    df[new_column] = concatenated.mask(missing_mask)

    return _drop_original_columns(
        df,
        columns,
        new_column,
        keep_original
    )


def _parse_formula(formula: str) -> ast.Expression:
    if len(formula) > MAX_FORMULA_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Formula is too long"
        )

    try:
        parsed = ast.parse(formula, mode="eval")
    except SyntaxError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid formula syntax: {exc.msg}"
        ) from exc

    if sum(1 for _ in ast.walk(parsed)) > MAX_FORMULA_NODES:
        raise HTTPException(
            status_code=400,
            detail="Formula is too complex"
        )

    return parsed


def _evaluate_formula_node(
    node: ast.AST,
    df: pd.DataFrame,
    referenced_columns: set[str]
) -> Any:
    if isinstance(node, ast.Expression):
        return _evaluate_formula_node(node.body, df, referenced_columns)

    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(
            node.value,
            (int, float)
        ):
            raise HTTPException(
                status_code=400,
                detail="Formula constants must be numeric"
            )
        if not np.isfinite(node.value):
            raise HTTPException(
                status_code=400,
                detail="Formula constants must be finite"
            )
        return node.value

    if isinstance(node, ast.Name):
        column = node.id
        validate_columns_exist(df, [column])

        if (
            not pd.api.types.is_numeric_dtype(df[column])
            or pd.api.types.is_bool_dtype(df[column])
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Formula column '{column}' must be numeric"
            )

        referenced_columns.add(column)
        return df[column]

    if isinstance(node, ast.BinOp):
        operation = ALLOWED_BINARY_OPERATORS.get(type(node.op))
        if operation is None:
            raise HTTPException(
                status_code=400,
                detail="Formula contains an unsupported operator"
            )

        left = _evaluate_formula_node(node.left, df, referenced_columns)
        right = _evaluate_formula_node(node.right, df, referenced_columns)

        if isinstance(node.op, ast.Pow) and np.isscalar(right):
            if abs(right) > 100:
                raise HTTPException(
                    status_code=400,
                    detail="Formula exponent is too large"
                )

        with np.errstate(divide="ignore", invalid="ignore", over="ignore"):
            try:
                return operation(left, right)
            except (ArithmeticError, TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Formula could not be calculated: {str(exc)}"
                ) from exc

    if isinstance(node, ast.UnaryOp):
        operation = ALLOWED_UNARY_OPERATORS.get(type(node.op))
        if operation is None:
            raise HTTPException(
                status_code=400,
                detail="Formula contains an unsupported unary operator"
            )

        operand = _evaluate_formula_node(
            node.operand,
            df,
            referenced_columns
        )
        return operation(operand)

    if isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name):
            raise HTTPException(
                status_code=400,
                detail="Formula attributes and method calls are not allowed"
            )

        function_name = node.func.id
        if function_name not in {"abs", "round"}:
            raise HTTPException(
                status_code=400,
                detail=f"Formula function '{function_name}' is not allowed"
            )

        if node.keywords:
            raise HTTPException(
                status_code=400,
                detail="Formula function keyword arguments are not allowed"
            )

        if function_name == "abs":
            if len(node.args) != 1:
                raise HTTPException(
                    status_code=400,
                    detail="abs() requires exactly one argument"
                )
            value = _evaluate_formula_node(
                node.args[0],
                df,
                referenced_columns
            )
            return np.abs(value)

        if len(node.args) not in {1, 2}:
            raise HTTPException(
                status_code=400,
                detail="round() requires one or two arguments"
            )

        value = _evaluate_formula_node(
            node.args[0],
            df,
            referenced_columns
        )
        decimals = 0

        if len(node.args) == 2:
            decimals = _evaluate_formula_node(
                node.args[1],
                df,
                referenced_columns
            )
            if (
                not isinstance(decimals, int)
                or isinstance(decimals, bool)
                or abs(decimals) > 15
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "round() decimals must be an integer between -15 and 15"
                    )
                )

        return np.round(value, decimals=decimals)

    raise HTTPException(
        status_code=400,
        detail=(
            f"Unsupported formula element: {type(node).__name__}. "
            "Only columns, numbers, arithmetic operators, abs(), and round() "
            "are allowed."
        )
    )


def _clean_numeric_result(
    result: Any,
    index: pd.Index
) -> pd.Series:
    if np.isscalar(result):
        result = pd.Series([result] * len(index), index=index)
    elif not isinstance(result, pd.Series):
        result = pd.Series(result, index=index)

    if pd.api.types.is_complex_dtype(result):
        result = result.apply(
            lambda value: np.nan if np.iscomplex(value) else value
        )

    result = pd.to_numeric(result, errors="coerce")
    return result.replace([np.inf, -np.inf], np.nan)


def calculate_column(
    df: pd.DataFrame,
    formula: str,
    new_column: str,
    columns: Optional[list[str]] = None,
    keep_original: bool = True
) -> pd.DataFrame:
    if not formula or not formula.strip():
        raise HTTPException(
            status_code=400,
            detail="calculate requires a formula"
        )

    if columns:
        validate_columns_exist(df, columns)
        non_numeric_columns = [
            column
            for column in columns
            if (
                not pd.api.types.is_numeric_dtype(df[column])
                or pd.api.types.is_bool_dtype(df[column])
            )
        ]
        if non_numeric_columns:
            raise HTTPException(
                status_code=400,
                detail=(
                    "calculate requires numeric columns. "
                    f"Non-numeric columns: {non_numeric_columns}"
                )
            )

    referenced_columns: set[str] = set()
    parsed_formula = _parse_formula(formula)
    result = _evaluate_formula_node(
        parsed_formula,
        df,
        referenced_columns
    )

    df[new_column] = _clean_numeric_result(result, df.index)
    source_columns = columns or list(referenced_columns)

    return _drop_original_columns(
        df,
        source_columns,
        new_column,
        keep_original
    )


def recode_column(
    df: pd.DataFrame,
    source_column: str,
    new_column: str,
    mapping: dict[str, Any],
    default_value: Any = None,
    keep_original: bool = True
) -> pd.DataFrame:
    validate_columns_exist(df, [source_column])

    if not mapping:
        raise HTTPException(
            status_code=400,
            detail="recode requires a non-empty mapping"
        )

    recoded = df[source_column].map(mapping)
    if default_value is not None:
        recoded = recoded.where(recoded.notna(), default_value)

    df[new_column] = recoded

    return _drop_original_columns(
        df,
        [source_column],
        new_column,
        keep_original
    )


def _validate_binning_rules(bins: list[BinningRule]) -> None:
    if not bins:
        raise HTTPException(
            status_code=400,
            detail="binning requires at least one bin"
        )

    for rule in bins:
        if not np.isfinite(rule.min) or not np.isfinite(rule.max):
            raise HTTPException(
                status_code=400,
                detail=f"Bin '{rule.label}' boundaries must be finite"
            )
        if rule.min > rule.max:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Bin '{rule.label}' has min greater than max"
                )
            )


def bin_column(
    df: pd.DataFrame,
    source_column: str,
    new_column: str,
    bins: list[BinningRule],
    default_value: Any = None,
    keep_original: bool = True
) -> pd.DataFrame:
    validate_columns_exist(df, [source_column])
    _validate_binning_rules(bins)

    if (
        not pd.api.types.is_numeric_dtype(df[source_column])
        or pd.api.types.is_bool_dtype(df[source_column])
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Binning column '{source_column}' must be numeric"
        )

    values = df[source_column]
    conditions = [
        values.between(rule.min, rule.max, inclusive="both")
        for rule in bins
    ]
    labels = [rule.label for rule in bins]
    df[new_column] = np.select(
        conditions,
        labels,
        default=default_value
    )

    return _drop_original_columns(
        df,
        [source_column],
        new_column,
        keep_original
    )


def transform_columns(
    df: pd.DataFrame,
    operation: ColumnTransformOperation,
    new_column: str,
    columns: Optional[list[str]] = None,
    source_column: Optional[str] = None,
    separator: str = "-",
    formula: Optional[str] = None,
    mapping: Optional[dict[str, Any]] = None,
    bins: Optional[list[BinningRule]] = None,
    default_value: Any = None,
    keep_original: bool = True,
    overwrite: bool = False
) -> pd.DataFrame:
    _validate_new_column(df, new_column, overwrite)
    result = df.copy()

    if operation == "concat":
        return concat_columns(
            result,
            columns or [],
            new_column,
            separator,
            keep_original
        )

    if operation == "calculate":
        return calculate_column(
            result,
            formula or "",
            new_column,
            columns,
            keep_original
        )

    if operation == "recode":
        if not source_column:
            raise HTTPException(
                status_code=400,
                detail="recode requires source_column"
            )
        return recode_column(
            result,
            source_column,
            new_column,
            mapping or {},
            default_value,
            keep_original
        )

    if operation == "binning":
        if not source_column:
            raise HTTPException(
                status_code=400,
                detail="binning requires source_column"
            )
        return bin_column(
            result,
            source_column,
            new_column,
            bins or [],
            default_value,
            keep_original
        )

    raise HTTPException(
        status_code=400,
        detail=f"Invalid column transformation operation: {operation}"
    )
