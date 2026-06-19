from fastapi import APIRouter,Query, Form

from backend.storage.dataset_store import get_dataset, save_dataset
from backend.services.outliers_service import (
    detect_outliers,
    detect_outliers_dataframe,
    apply_action,
    clean_for_json
)

router = APIRouter(
    prefix="/outliers",
    tags=["Outliers"]
)


@router.get("/detect")
async def detect(
    dataset_id: str = Query(...),
    method: str = Query(...),
    columns: str = Query(...),
    factor: float = Query(1.5, ge=0.01, le=10.0)
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    if df.is_empty():
        return {"error": "Aucune donnée disponible."}

    selected_cols = [c.strip() for c in columns.split(",")]

    missing = [c for c in selected_cols if c not in df.columns]
    if missing:
        return {"error": f"Colonnes introuvables dans le fichier : {missing}"}

    if method == "iqr":
        results = detect_outliers_dataframe(df, selected_cols, method=method, factor=factor)
    elif method == "zscore":
        results = detect_outliers_dataframe(df, selected_cols, method=method, threshold=factor)
    elif method == "grubbs":
        results = detect_outliers_dataframe(df, selected_cols, method=method, alpha=factor)
    else:
        return {"error": "Méthode inconnue"}

    # Sauvegarde du dataset dans preview pour que /apply puisse l'utiliser directement
    save_dataset(dataset_id, df, stage="preview")

    return {"results": clean_for_json(results)}


@router.post("/apply")
async def apply(
    dataset_id: str = Form(...),
    column: str = Form(...),
    action: str = Form(..., description="Action : delete | replace_median | replace_mean | mark | ignore"),
    method: str = Form("iqr", description="Méthode : iqr | zscore | grubbs"),
    factor: float = Form(1.5, ge=0.01, le=10.0)
):
    # Lit le preview sauvegardé par /detect
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return {"error": "Lance d'abord /outliers/detect"}

    if df.is_empty():
        return {"error": "Aucune donnée disponible."}

    if column not in df.columns:
        return {"error": f"Colonne introuvable : {column}"}

    if method == "iqr":
        result = detect_outliers(df[column], method=method, factor=factor)
    elif method == "zscore":
        result = detect_outliers(df[column], method=method, threshold=factor)
    elif method == "grubbs":
        result = detect_outliers(df[column], method=method, alpha=factor)
    else:
        return {"error": "Méthode inconnue"}

    df_clean = apply_action(df, column, result["outlier_indices"], action)

    # Réécrit le preview avec le résultat de l'action
    save_dataset(dataset_id, df_clean, stage="preview")

    return {
        "message": f"Action {action} appliquée. Appelle /dataset/apply-preview pour confirmer.",
        "outliers_traités": result["outlier_count"],
        "preview": clean_for_json(df_clean.head(5).to_dicts())
    }