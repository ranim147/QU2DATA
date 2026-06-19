from fastapi import APIRouter , Query, Form 

from backend.storage.dataset_store import get_dataset, save_dataset
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


@router.get("/analyze")
async def duplicates_analyze(
    dataset_id: str = Query(...),
    subset: str | None = Query(None)
):
    df = get_dataset(dataset_id)
    if df is None:
        return {"error": "Dataset introuvable"}

    cols = [c.strip() for c in subset.split(",")] if subset else None

    result = analyze_duplicates(df, subset=cols)

    # sauvegarde du preview temporaire
    save_dataset(dataset_id, df, stage="preview")

    return result


@router.get("/recommend")
async def duplicates_recommend(
    dataset_id: str = Query(...)
):
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
    # Lit le preview sauvegardé par /analyze
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return {"error": "Lance d'abord /duplicates/analyze"}

    cols = [c.strip() for c in subset.split(",")] if subset else None

    result = remove_duplicates(df, subset=cols, keep=keep)

    if "error" in result:
        return result

    # Réécrit le preview avec le résultat de la suppression
    save_dataset(dataset_id, result["df"], stage="preview")

    return {
        "message": f"{result['message']} Appelle /dataset/apply-preview pour confirmer.",
        "rows_before": result["rows_before"],
        "rows_after": result["rows_after"],
        "rows_removed": result["rows_removed"],
        "preview": safe_preview(result["df"])
    }