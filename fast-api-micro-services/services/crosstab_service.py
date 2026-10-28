from typing import Any

import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List

MISSING_LABEL = "Missing"
TOTAL_LABEL = "Total"


def _safe_divide(
    numerator: pd.DataFrame,
    denominator: pd.Series | float,
    axis: int = 0
) -> pd.DataFrame:
    with np.errstate(divide="ignore", invalid="ignore"):
        result = numerator.div(denominator, axis=axis) * 100
    return result.replace([np.inf, -np.inf], np.nan).fillna(0)


def _format_value(value: Any, normalize: str) -> int | float:
    if normalize == "none":
        return int(value)
    return round(float(value), 2)


def _stringify_labels(labels: list[Any]) -> list[str]:
    return [str(label) for label in labels]


def _table_to_records(
    table_df: pd.DataFrame,
    row_name: str,
    normalize: str
) -> list[dict[str, Any]]:
    records = []

    for index, row_values in table_df.iterrows():
        record: dict[str, Any] = {row_name: str(index)}
        for column_name, value in row_values.items():
            record[str(column_name)] = _format_value(value, normalize)
        records.append(record)

    return records


def _add_count_totals(counts: pd.DataFrame) -> pd.DataFrame:
    result = counts.copy()
    result[TOTAL_LABEL] = result.sum(axis=1)
    total_row = result.sum(axis=0)
    total_row.name = TOTAL_LABEL
    return pd.concat([result, total_row.to_frame().T])


def _row_percentages(
    counts: pd.DataFrame,
    include_totals: bool
) -> pd.DataFrame:
    result = _safe_divide(counts, counts.sum(axis=1), axis=0)

    if include_totals:
        result[TOTAL_LABEL] = 100.0
        column_totals = counts.sum(axis=0)
        grand_total = float(column_totals.sum())
        if grand_total == 0:
            total_row = pd.Series(0.0, index=result.columns, name=TOTAL_LABEL)
        else:
            total_row = (column_totals / grand_total) * 100
            total_row[TOTAL_LABEL] = 100.0
            total_row.name = TOTAL_LABEL
        result = pd.concat([result, total_row.to_frame().T])

    return result


def _column_percentages(
    counts: pd.DataFrame,
    include_totals: bool
) -> pd.DataFrame:
    result = _safe_divide(counts, counts.sum(axis=0), axis=1)

    if include_totals:
        row_totals = counts.sum(axis=1)
        grand_total = float(row_totals.sum())
        if grand_total == 0:
            result[TOTAL_LABEL] = 0.0
        else:
            result[TOTAL_LABEL] = (row_totals / grand_total) * 100

        total_row = pd.Series(100.0, index=result.columns, name=TOTAL_LABEL)
        result = pd.concat([result, total_row.to_frame().T])

    return result


def _all_percentages(
    counts: pd.DataFrame,
    include_totals: bool
) -> pd.DataFrame:
    grand_total = float(counts.to_numpy().sum())
    result = counts * 0.0 if grand_total == 0 else (counts / grand_total) * 100

    if include_totals:
        result[TOTAL_LABEL] = result.sum(axis=1)
        total_row = result.sum(axis=0)
        total_row.name = TOTAL_LABEL
        result = pd.concat([result, total_row.to_frame().T])

    return result


def generate_crosstab(
    df: pd.DataFrame,
    row: str,
    column: str,
    normalize: str = "none",
    include_totals: bool = True,
    include_missing: bool = False
) -> dict[str, Any]:
    row = row.strip()
    column = column.strip()

    if not row:
        raise HTTPException(status_code=400, detail="Row variable is required")
    if not column:
        raise HTTPException(
            status_code=400,
            detail="Column variable is required"
        )
    if normalize not in {"none", "row", "column", "all"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid normalize value"
        )
    if row == column:
        raise HTTPException(
            status_code=400,
            detail="Row and column variables must be different"
        )
    if row not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Column for row variable does not exist"
        )
    if column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Column for column variable does not exist"
        )

    working_df = df[[row, column]].copy()
    if include_missing:
        working_df = working_df.astype(object).where(
            pd.notna(working_df),
            MISSING_LABEL
        )
    else:
        working_df = working_df.dropna(subset=[row, column])

    counts = pd.crosstab(working_df[row], working_df[column], dropna=False)

    if normalize == "none":
        table_df = _add_count_totals(counts) if include_totals else counts
    elif normalize == "row":
        table_df = _row_percentages(counts, include_totals)
    elif normalize == "column":
        table_df = _column_percentages(counts, include_totals)
    else:
        table_df = _all_percentages(counts, include_totals)

    row_categories = _stringify_labels(list(table_df.index))
    column_categories = _stringify_labels(list(table_df.columns))

    return {
        "row_categories": row_categories,
        "column_categories": column_categories,
        "table": _table_to_records(table_df, row, normalize)
    }


def create_crosstab(
    df: pd.DataFrame,
    row_cols: List[str],
    col_cols: List[str],
    values: str,
    agg_func: str = "mean",
    normalize: bool = False
) -> pd.DataFrame:
    
    # Nettoyage des listes (supprime espaces)
    row_cols = [c.strip() for c in row_cols if c.strip()]
    col_cols = [c.strip() for c in col_cols if c.strip()]

    all_group_cols = row_cols + col_cols

    # === VALIDATIONS FORTES ===
    if not row_cols:
        raise ValueError("Au moins une variable en lignes (rows) est requise.")

    if values in all_group_cols:
        raise ValueError(f"La colonne '{values}' ne peut pas être à la fois dans rows/columns et dans values.")

    missing = [c for c in all_group_cols + [values] if c not in df.columns]
    if missing:
        raise ValueError(f"Colonnes introuvables : {missing}")

    # === GROUP BY ===
    crosstab = (
        df[all_group_cols + [values]]
        .groupby(all_group_cols, dropna=False)[values]
        .agg(agg_func)
        .reset_index()
        .sort_values(all_group_cols)
    )

    # === PIVOT ===
    if col_cols:
        try:
            crosstab = crosstab.pivot_table(
                values=values,
                index=row_cols,
                columns=col_cols,
                aggfunc=agg_func,
                dropna=False,
            ).reset_index()
            if isinstance(crosstab.columns, pd.MultiIndex):
                crosstab.columns = [
                    "_".join(str(part) for part in column if str(part) != "")
                    for column in crosstab.columns
                ]
        except Exception as e:
            raise ValueError(f"Erreur pivot : {str(e)}. Essaie avec moins de colonnes ou vérifie les doublons.")

    # === NORMALISATION ===
    if normalize and col_cols:
        value_cols = [c for c in crosstab.columns if c not in row_cols]
        row_totals = crosstab[value_cols].sum(axis=1).replace(0, np.nan)
        crosstab[value_cols] = crosstab[value_cols].div(row_totals, axis=0).mul(100).round(2)

    return crosstab


def clean_for_json(df: pd.DataFrame):
    return (
        df.head(200)
        .replace([np.inf, -np.inf], np.nan)
        .astype(object)
        .where(pd.notna(df.head(200)), None)
        .to_dict(orient="records")
    )
