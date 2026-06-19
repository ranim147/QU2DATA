from fastapi import APIRouter, Form
from backend.storage.dataset_store import get_dataset, save_dataset
from backend.services.sampling_service import (
    stratified_sample,
    bootstrap_sample,
    safe_preview
)

router = APIRouter(
    prefix="/sampling",
    tags=["Sampling"]
)


@router.post("/stratified")
async def stratified(
    dataset_id: str = Form(...),
    strate_col: str = Form(..., description="Colonne de stratification ex: region"),
    n: int = Form(None, description="Nombre total de lignes souhaitées (optionnel)"),
    mode: str = Form("proportionnel", description="proportionnel | equilibre")
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    result = stratified_sample(df, strate_col=strate_col, n=n, mode=mode)

    if "error" in result:
        return result

    save_dataset(dataset_id, result["df"], stage="preview")

    return {
        "message": f"Échantillonnage stratifié appliqué ({result['mode']})",
        "strate_col": result["strate_col"],
        "modalites": result["modalites"],
        "rows_original": result["rows_original"],
        "rows_sampled": result["rows_sampled"],
        "marge_erreur": result["marge_erreur"],
        "niveau_confiance": result["niveau_confiance"],
        "preview": result["preview"]
    }

@router.post("/bootstrap")
async def bootstrap(
    dataset_id: str = Form(...),
    n: int = Form(..., description="Nombre de lignes à tirer avec remise")
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    result = bootstrap_sample(df, n=n)

    if "error" in result:
        return result

    save_dataset(dataset_id, result["df"], stage="preview")

    return {
        "message": f"Échantillonnage bootstrap appliqué (n={n})",
        "rows_original": result["rows_original"],
        "rows_sampled": result["rows_sampled"],
        "marge_erreur": result["marge_erreur"],
        "niveau_confiance": result["niveau_confiance"],
        "preview": result["preview"]
    }

