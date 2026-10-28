import uuid

import pandas as pd
from fastapi import APIRouter, HTTPException

from schemas.file_merge_schema import (
    FileMergeConfiguration,
    FileMergeExecuteData,
    FileMergePreviewData,
    FileMergeRecommendRequest,
    FileMergeRecommendationData,
)
from services.file_merge_service import (
    FileMergeValidationError,
    dataframe_records,
    merge_dataframes,
    recommend_merge,
)
from storage.dataset_store import (
    delete_dataset,
    get_dataset,
    init_dataset,
)
from utils.response import APIResponse


router = APIRouter(prefix="/file-merge", tags=["File Merge"])


def _load_current_dataset(dataset_id: str, label: str) -> pd.DataFrame:
    try:
        return get_dataset(dataset_id, stage="current")
    except HTTPException:
        raise
    except pd.errors.EmptyDataError as error:
        raise HTTPException(
            status_code=400,
            detail=f"{label} dataset is empty",
        ) from error
    except pd.errors.ParserError as error:
        raise HTTPException(
            status_code=400,
            detail=f"{label} dataset CSV is invalid",
        ) from error


def _merge_or_http_error(
    request: FileMergeConfiguration,
):
    left = _load_current_dataset(request.left_file_id, "Left")
    right = _load_current_dataset(request.right_file_id, "Right")
    try:
        return merge_dataframes(left, right, request)
    except FileMergeValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post(
    "/recommend",
    response_model=APIResponse[FileMergeRecommendationData],
)
async def recommend_file_merge(request: FileMergeRecommendRequest):
    left = _load_current_dataset(request.left_file_id, "Left")
    right = _load_current_dataset(request.right_file_id, "Right")
    try:
        recommendation = recommend_merge(left, right)
    except FileMergeValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return APIResponse.ok(
        FileMergeRecommendationData(**recommendation),
        message="File merge recommendation generated successfully",
    )


@router.post(
    "/preview",
    response_model=APIResponse[FileMergePreviewData],
)
async def preview_file_merge(request: FileMergeConfiguration):
    result = _merge_or_http_error(request)
    data = FileMergePreviewData(
        operation=request.operation,
        columns=list(result.dataframe.columns),
        rows=len(result.dataframe),
        preview=dataframe_records(result.dataframe.head(request.preview_limit)),
        warnings=result.warnings,
        type_conflicts=result.type_conflicts,
        statistics=result.statistics,
    )
    return APIResponse.ok(
        data,
        message="File merge preview generated successfully",
    )


@router.post(
    "/execute",
    response_model=APIResponse[FileMergeExecuteData],
)
async def execute_file_merge(request: FileMergeConfiguration):
    result = _merge_or_http_error(request)
    dataset_id = str(uuid.uuid4())
    try:
        init_dataset(dataset_id, result.dataframe)
    except Exception:
        delete_dataset(dataset_id, stage="original")
        delete_dataset(dataset_id, stage="current")
        delete_dataset(dataset_id, stage="preview")
        raise

    data = FileMergeExecuteData(
        dataset_id=dataset_id,
        left_file_id=request.left_file_id,
        right_file_id=request.right_file_id,
        created_objects=["original.csv", "current.csv"],
        operation=request.operation,
        columns=list(result.dataframe.columns),
        rows=len(result.dataframe),
        preview=dataframe_records(result.dataframe.head(request.preview_limit)),
        warnings=result.warnings,
        type_conflicts=result.type_conflicts,
        statistics=result.statistics,
    )
    return APIResponse.ok(
        data,
        message="Files merged into a new dataset successfully",
    )
