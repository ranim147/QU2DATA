import polars as pl
from typing import List

def create_crosstab(
    df: pl.DataFrame,
    row_cols: List[str],
    col_cols: List[str],
    values: str,
    agg_func: str = "mean",
    normalize: bool = False
) -> pl.DataFrame:
    
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
    agg_dict = {
        "mean": pl.col(values).mean(),
        "sum": pl.col(values).sum(),
        "count": pl.col(values).count(),
        "median": pl.col(values).median(),
        "min": pl.col(values).min(),
        "max": pl.col(values).max(),
    }

    crosstab = (
        df.select(all_group_cols + [values])   # On prend seulement ce dont on a besoin
        .group_by(all_group_cols)
        .agg(agg_dict[agg_func].alias(values))
        .sort(all_group_cols)
    )

    # === PIVOT ===
    if col_cols:
        try:
            crosstab = crosstab.pivot(
                values=values,
                index=row_cols,
                columns=col_cols,
                aggregate_function=agg_func
            )
        except Exception as e:
            raise ValueError(f"Erreur pivot : {str(e)}. Essaie avec moins de colonnes ou vérifie les doublons.")

    # === NORMALISATION ===
    if normalize and col_cols:
        value_cols = [c for c in crosstab.columns if c not in row_cols]
        for col in value_cols:
            crosstab = crosstab.with_columns(
                (pl.col(col) / pl.sum_horizontal(value_cols).over(row_cols) * 100)
                .round(2)
                .alias(col)
            )

    return crosstab


def clean_for_json(df: pl.DataFrame):
    return df.head(200).to_dicts()