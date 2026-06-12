from fastapi import APIRouter, Form

from backend.storage.dataset_store import get_dataset, update_dataset
from backend.services.type_correction_service import (
    recommend_type_corrections,
    apply_type_correction,
    safe_preview
)

router = APIRouter(
    prefix="/types",
    tags=["Types"]
)


@router.post("/recommend")
async def types_recommend(dataset_id: str = Form(...)):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    return await recommend_type_corrections(df)


@router.post("/apply")
async def types_apply(
    dataset_id: str = Form(...),
    column: str = Form(...),
    target_type: str = Form(...)
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    result = apply_type_correction(df, column, target_type)

    if "error" in result:
        return result

    update_dataset(dataset_id, result["df"])

    return {
        "message": result["message"],
        "column": result["column"],
        "original_type": result["original_type"],
        "new_type": result["new_type"],
        "conversion_failures": result["conversion_failures"],
        "preview": safe_preview(result["df"])
    }