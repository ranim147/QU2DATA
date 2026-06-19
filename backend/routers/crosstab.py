from fastapi import APIRouter, Query, Form
from typing import List, Optional
import polars as pl

from backend.storage.dataset_store import get_dataset, save_dataset
from backend.services.crosstab_service import create_crosstab, clean_for_json

router = APIRouter(prefix="/crosstab", tags=["Crosstab"])

@router.get("/compute")
async def compute_crosstab(
    dataset_id: str = Query(...),
    rows: str = Query(..., description="Variables en lignes, séparées par virgule"),
    columns: str = Query("", description="Variables en colonnes, séparées par virgule (optionnel)"),
    values: str = Query(..., description="Variable numérique à agréger"),
    agg_func: str = Query("mean", description="mean | sum | count | median | min | max"),
    normalize: bool = Query(False, description="Normaliser en pourcentages")
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    row_cols = [c.strip() for c in rows.split(",") if c.strip()]
    col_cols = [c.strip() for c in columns.split(",") if c.strip()] if columns else []

    if not row_cols:
        return {"error": "Au moins une variable en ligne est requise"}

    # Vérification des colonnes
    missing = [c for c in row_cols + col_cols + [values] if c not in df.columns]
    if missing:
        return {"error": f"Colonnes introuvables : {missing}"}

    result = create_crosstab(
        df, 
        row_cols=row_cols,
        col_cols=col_cols,
        values=values,
        agg_func=agg_func,
        normalize=normalize
    )

    # Sauvegarde en preview (comme pour outliers)
    save_dataset(dataset_id, df, stage="preview")

    return {
        "result": clean_for_json(result),
        "shape": result.shape,
        "row_variables": row_cols,
        "col_variables": col_cols
    }