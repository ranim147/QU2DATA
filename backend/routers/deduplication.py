from fastapi import APIRouter, Form

from backend.storage.dataset_store import get_dataset, update_dataset
from backend.services.deduplication_service import (
    analyze_duplicates,
    remove_duplicates,
    recommend_dedup_columns,
    safe_preview
)

router = APIRouter(
    prefix="/duplicates",
    tags=["Duplicates"]
)


@router.post("/analyze")
async def duplicates_analyze(
    dataset_id: str = Form(...),
    subset: str = Form(None)
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    cols = [c.strip() for c in subset.split(",")] if subset else None

    return analyze_duplicates(df, subset=cols)


@router.post("/recommend")
async def duplicates_recommend(dataset_id: str = Form(...)):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    return await recommend_dedup_columns(df)


@router.post("/remove")
async def duplicates_remove(
    dataset_id: str = Form(...),
    subset: str = Form(None),
    keep: str = Form("first")
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    cols = [c.strip() for c in subset.split(",")] if subset else None

    result = remove_duplicates(df, subset=cols, keep=keep)

    if "error" in result:
        return result

    update_dataset(dataset_id, result["df"])

    return {
        "message": result["message"],
        "rows_before": result["rows_before"],
        "rows_after": result["rows_after"],
        "rows_removed": result["rows_removed"],
        "preview": safe_preview(result["df"])
    }