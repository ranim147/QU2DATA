from fastapi import APIRouter, Query

from services.minio_file_store_service import get_dataset, load_working_dataframe, save_dataset
from services.outliers_service import (
    detect_outliers,
    detect_outliers_dataframe,
    apply_action,
    clean_for_json
)
from utils.response import APIResponse
from schemas.outliers_schema import (
    ApplyOutliersRequest,
    ApplyOutliersResponseData,
    DetectOutliersResponseData,
)

router = APIRouter(prefix="/outliers", tags=["Transformation"])

VALID_METHODS = ("iqr", "zscore", "grubbs")
VALID_ACTIONS = ("delete", "replace_median", "replace_mean", "mark", "ignore")


@router.get("/detect", response_model=APIResponse[DetectOutliersResponseData])
async def detect(
    dataset_id: str = Query(...),
    method: str = Query(...),
    columns: str = Query(...),
    factor: float = Query(1.5, ge=0.01, le=10.0)
):
    df, _source = load_working_dataframe(dataset_id)
    if df is None:
        return APIResponse.fail("Dataset introuvable")

    if df.empty:
        return APIResponse.fail("Aucune donnée disponible")

    if method not in VALID_METHODS:
        return APIResponse.fail(f"Méthode inconnue. Valeurs acceptées : {', '.join(VALID_METHODS)}")

    selected_cols = [c.strip() for c in columns.split(",")]
    missing = [c for c in selected_cols if c not in df.columns]
    if missing:
        return APIResponse.fail(f"Colonnes introuvables : {missing}")

    if method == "iqr":
        results = detect_outliers_dataframe(df, selected_cols, method=method, factor=factor)
    elif method == "zscore":
        results = detect_outliers_dataframe(df, selected_cols, method=method, threshold=factor)
    else:
        results = detect_outliers_dataframe(df, selected_cols, method=method, alpha=factor)

    save_dataset(dataset_id, df, stage="preview")

    return APIResponse.ok(DetectOutliersResponseData(
        file_id=dataset_id,
        results=clean_for_json(results)
    ))


@router.post("/apply", response_model=APIResponse[ApplyOutliersResponseData])
async def apply(request: ApplyOutliersRequest):
    dataset_id = request.dataset_id
    column = request.column
    action = request.action
    method = request.method
    factor = request.factor

    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return APIResponse.fail("Lance d'abord /outliers/detect")

    if df.empty:
        return APIResponse.fail("Aucune donnée disponible")

    if column not in df.columns:
        return APIResponse.fail(f"Colonne introuvable : {column}")

    if method not in VALID_METHODS:
        return APIResponse.fail(f"Méthode inconnue. Valeurs acceptées : {', '.join(VALID_METHODS)}")

    if action not in VALID_ACTIONS:
        return APIResponse.fail(f"Action inconnue. Valeurs acceptées : {', '.join(VALID_ACTIONS)}")

    if method == "iqr":
        result = detect_outliers(df[column], method=method, factor=factor)
    elif method == "zscore":
        result = detect_outliers(df[column], method=method, threshold=factor)
    else:
        result = detect_outliers(df[column], method=method, alpha=factor)

    df_clean = apply_action(df, column, result["outlier_indices"], action)
    save_dataset(dataset_id, df_clean, stage="preview")

    return APIResponse.ok(ApplyOutliersResponseData(
        file_id=dataset_id,
        message=f"Action '{action}' appliquée. Appelle /dataset/apply-preview pour confirmer.",
        outliers_traites=result["outlier_count"],
        preview=clean_for_json(df_clean.head(5).to_dict(orient="records"))
    ))
