from fastapi import APIRouter, Query

from services.minio_file_store_service import get_dataset, load_working_dataframe, save_dataset
from services.type_correction_service import (
    recommend_type_corrections,
    apply_type_correction,
    safe_preview
)
from utils.response import APIResponse
from schemas.type_correction_schema import (
    ApplyTypeCorrectionRequest,
    RecommendTypeCorrectionsResponseData,
    ApplyTypeCorrectionResponseData,
)

router = APIRouter(prefix="/types", tags=["Transformation"])


@router.get("/recommend", response_model=APIResponse[RecommendTypeCorrectionsResponseData])
async def types_recommend(
    dataset_id: str = Query(...)
):
    df, _source = load_working_dataframe(dataset_id)
    if df is None:
        return APIResponse.fail("Dataset introuvable")

    result = await recommend_type_corrections(df)
    save_dataset(dataset_id, df, stage="preview")

    return APIResponse.ok(RecommendTypeCorrectionsResponseData(
        file_id=dataset_id,
        recommendations=result
    ))


@router.post("/apply", response_model=APIResponse[ApplyTypeCorrectionResponseData])
async def types_apply(request: ApplyTypeCorrectionRequest):
    dataset_id = request.dataset_id
    column = request.column
    target_type = request.target_type
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        return APIResponse.fail("Lance d'abord /types/recommend")

    result = apply_type_correction(df, column, target_type)

    if "error" in result:
        return APIResponse.fail(result["error"])

    save_dataset(dataset_id, result["df"], stage="preview")

    return APIResponse.ok(ApplyTypeCorrectionResponseData(
        file_id=dataset_id,
        message=f"{result['message']} Appelle /dataset/apply-preview pour confirmer.",
        column=result["column"],
        original_type=result["original_type"],
        new_type=result["new_type"],
        conversion_failures=result["conversion_failures"],
        preview=safe_preview(result["df"])
    ))
