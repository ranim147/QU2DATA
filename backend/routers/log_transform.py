from fastapi import APIRouter,Query, Form

from backend.storage.dataset_store import get_dataset, save_dataset
from backend.services.log_transform_service import (
    detect_log_transform_dataframe,
    apply_log_transform,
    clean_for_json
)

router = APIRouter(
    prefix="/log-transform",
    tags=["Log Transform"]
)


@router.get("/detect")
async def detect(
    dataset_id: str = Query(...),
    method: str = Query("log1p"),
    columns: str = Query(...)
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

    if method not in ("log1p", "log"):
        return {"error": "Méthode inconnue"}

    results = detect_log_transform_dataframe(df, selected_cols, method=method)

    # Sauvegarde du dataset dans preview pour que /apply puisse l'utiliser directement
    save_dataset(dataset_id, df, stage="preview")

    return {"results": clean_for_json(results)}


@router.post("/apply")
async def apply(
    dataset_id: str = Form(...),
    column: str = Form(...),
    method: str = Form("log1p", description="Méthode : log1p | log"),
    action: str = Form("replace", description="Action : replace | new_column | ignore")
):
    # Lit le preview sauvegardé par /detect
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return {"error": "Lance d'abord /log-transform/detect"}

    if df.is_empty():
        return {"error": "Aucune donnée disponible."}

    if column not in df.columns:
        return {"error": f"Colonne introuvable : {column}"}

    if method not in ("log1p", "log"):
        return {"error": "Méthode inconnue"}

    try:
        df_clean = apply_log_transform(df, column, method=method, action=action)
    except ValueError as e:
        return {"error": str(e)}

    # Réécrit le preview avec le résultat de la transformation
    save_dataset(dataset_id, df_clean, stage="preview")

    return {
        "message": f"Transformation logarithmique ({method}, {action}) appliquée sur {column}. Appelle /dataset/apply-preview pour confirmer.",
        "preview": clean_for_json(df_clean.head(5).to_dicts())
    }