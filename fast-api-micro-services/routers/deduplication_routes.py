from fastapi import APIRouter, Query

from services.minio_file_store_service import get_dataset, load_working_dataframe, save_dataset
from services.deduplication_service import (
    analyze_duplicates,
    remove_duplicates,
    recommend_dedup_columns,
    safe_preview
)
from utils.response import APIResponse
from schemas.deduplication_schema import (
    AnalyzeDuplicatesResponseData,
    RecommendDeduplicationResponseData,
    RemoveDuplicatesRequest,
    RemoveDuplicatesResponseData
)

router = APIRouter(prefix="/duplicates", tags=["Transformation"])


@router.get("/analyze", response_model=APIResponse[AnalyzeDuplicatesResponseData])
async def duplicates_analyze(
    file_id: str = Query(...),
    subset: str | None = Query(None)
):
    df, _source = load_working_dataframe(file_id)
    if df is None:
        return APIResponse.fail("Dataset introuvable")

    cols = [c.strip() for c in subset.split(",")] if subset else None
    result = analyze_duplicates(df, subset=cols)
    save_dataset(file_id, df, stage="preview")

    return APIResponse.ok(AnalyzeDuplicatesResponseData(
        file_id=file_id,
        **result
    ))


@router.get("/recommend", response_model=APIResponse[RecommendDeduplicationResponseData])
async def duplicates_recommend(
    file_id: str = Query(...)
):
    df, _source = load_working_dataframe(file_id)
    if df is None:
        return APIResponse.fail("Dataset introuvable")

    result = await recommend_dedup_columns(df)

    if "error" in result:
        return APIResponse.fail(result["error"])

    return APIResponse.ok(RecommendDeduplicationResponseData(
        file_id=file_id,
        **result
    ))

@router.post("/remove", response_model=APIResponse[RemoveDuplicatesResponseData])
async def duplicates_remove(request: RemoveDuplicatesRequest):
    file_id = request.file_id
    subset = request.subset
    keep = request.keep

    df = get_dataset(file_id, stage="preview")
    if df is None:
        return APIResponse.fail("Lance d'abord /duplicates/analyze")

    cols = [c.strip() for c in subset.split(",")] if subset else None
    result = remove_duplicates(df, subset=cols, keep=keep)

    if "error" in result:
        return APIResponse.fail(result["error"])

    save_dataset(file_id, result["df"], stage="preview")

    return APIResponse.ok(RemoveDuplicatesResponseData(
        file_id=file_id,
        message=f"{result['message']} Appelle /dataset/apply-preview pour confirmer.",
        rows_before=result["rows_before"],
        rows_after=result["rows_after"],
        rows_removed=result["rows_removed"],
        preview=safe_preview(result["df"])
    ))
