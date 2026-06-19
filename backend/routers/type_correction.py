from fastapi import APIRouter, Query, Form

from backend.storage.dataset_store import get_dataset, save_dataset
from backend.services.type_correction_service import (
    recommend_type_corrections,
    apply_type_correction,
    safe_preview
)

router = APIRouter(
    prefix="/types",
    tags=["Types"]
)


@router.get("/recommend")
async def types_recommend(
    dataset_id: str = Query(...)
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    result = await recommend_type_corrections(df)

    # Sauvegarde du dataset dans preview pour que /apply puisse l'utiliser directement
    save_dataset(dataset_id, df, stage="preview")

    return result


@router.post("/apply")
async def types_apply(
    dataset_id: str = Form(...),
    column: str = Form(...),
    target_type: str = Form(...)
):
    # Lit le preview sauvegardé par /recommend
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return {"error": "Lance d'abord /types/recommend"}

    result = apply_type_correction(df, column, target_type)

    if "error" in result:
        return result

    # Réécrit le preview avec le résultat de la correction
    save_dataset(dataset_id, result["df"], stage="preview")

    return {
        "message": f"{result['message']} Appelle /dataset/apply-preview pour confirmer.",
        "column": result["column"],
        "original_type": result["original_type"],
        "new_type": result["new_type"],
        "conversion_failures": result["conversion_failures"],
        "preview": safe_preview(result["df"])
    }