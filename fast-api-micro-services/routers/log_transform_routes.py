from fastapi import APIRouter, Query
import pandas as pd

from services.minio_file_store_service import get_dataset, load_working_dataframe, save_dataset
from services.log_transform_service import (
    detect_log_transform_dataframe,
    apply_log_transform,
    clean_for_json
)
from utils.response import APIResponse
from schemas.log_transformation_schema import (
    ApplyLogTransformRequest,
    DetectLogTransformResponseData,
    ApplyLogTransformResponseData,
)

router = APIRouter(prefix="/log-transform", tags=["Transformation"])


@router.get("/detect", response_model=APIResponse[DetectLogTransformResponseData])
async def detect(
    dataset_id: str = Query(...),
    method: str = Query("log1p"),
    columns: str = Query(...)
):
    df, _source = load_working_dataframe(dataset_id)
    if df is None:
        return APIResponse.fail("Dataset introuvable")

    if df.empty:
        return APIResponse.fail("Aucune donnée disponible")

    selected_cols = [c.strip() for c in columns.split(",")]

    missing = [c for c in selected_cols if c not in df.columns]
    if missing:
        return APIResponse.fail(f"Colonnes introuvables dans le fichier : {missing}")

    non_numeric = [
        c for c in selected_cols
        if not pd.api.types.is_numeric_dtype(df[c])
    ]
    if non_numeric:
        return APIResponse.fail(f"Colonnes non numériques : {non_numeric}")

    if method not in ("log1p", "log"):
        return APIResponse.fail("Méthode inconnue. Valeurs acceptées : log1p, log")

    results = detect_log_transform_dataframe(df, selected_cols, method=method)
    save_dataset(dataset_id, df, stage="preview")

    return APIResponse.ok(DetectLogTransformResponseData(
        file_id=dataset_id,
        results=clean_for_json(results)
    ))


@router.post("/apply", response_model=APIResponse[ApplyLogTransformResponseData])
async def apply(request: ApplyLogTransformRequest):
    dataset_id = request.dataset_id
    column = request.column
    method = request.method
    action = request.action
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return APIResponse.fail("Lance d'abord /log-transform/detect")

    if df.empty:
        return APIResponse.fail("Aucune donnée disponible")

    if column not in df.columns:
        return APIResponse.fail(f"Colonne introuvable : {column}")

    if method not in ("log1p", "log"):
        return APIResponse.fail("Méthode inconnue. Valeurs acceptées : log1p, log")

    if action not in ("replace", "new_column", "ignore"):
        return APIResponse.fail("Action inconnue. Valeurs acceptées : replace, new_column, ignore")

    try:
        df_clean = apply_log_transform(df, column, method=method, action=action)
    except ValueError as e:
        return APIResponse.fail(str(e))

    save_dataset(dataset_id, df_clean, stage="preview")

    return APIResponse.ok(ApplyLogTransformResponseData(
        file_id=dataset_id,
        message=f"Transformation logarithmique ({method}, {action}) appliquée sur {column}. Appelle /dataset/apply-preview pour confirmer.",
        preview=clean_for_json(df_clean.head(5).to_dict(orient="records"))
    ))
