from typing import Any

import pandas as pd
from fastapi import APIRouter

from utils.dataframe_utils import (
    persist_transformation_result,
    records_from_dataframe,
)
from schemas.column_transform_schema import (
    BinningColumnRequest,
    CalculateColumnRequest,
    ColumnTransformResponseData,
    ConcatColumnsRequest,
    RecodeColumnRequest,
)
from services.minio_file_store_service import load_working_dataframe
from services.transformation_service import transform_columns
from utils.response import APIResponse
router = APIRouter(tags=["Column Transformations"])


def _build_transform_response(
    file_id: str,
    operation: str,
    new_column: str,
    columns_before: int,
    transformed_df: pd.DataFrame,
    source: str
) -> dict[str, Any]:
    persistence = persist_transformation_result(
        file_id,
        transformed_df,
    )

    records = records_from_dataframe(transformed_df)
    result = ColumnTransformResponseData(
        file_id=file_id,
        source=source,
        **persistence,
        operation=operation,
        rows=len(transformed_df),
        new_column=new_column,
        columns_before=columns_before,
        columns_after=len(transformed_df.columns),
        columns=list(transformed_df.columns),
        preview=records[:5],
        data=records
    )
    message = f"Column {operation} generated successfully in preview"
    return APIResponse.ok(
        data=result,
        message=message
    )


@router.post(
    "/preprocessing/column/transform/concat",
    response_model=APIResponse
)
def concat_file_columns(request: ConcatColumnsRequest):
    df, source = load_working_dataframe(request.file_id)
    columns_before = len(df.columns)
    transformed_df = transform_columns(
        df=df,
        operation="concat",
        columns=request.columns,
        new_column=request.new_column,
        separator=request.separator,
        keep_original=request.keep_original,
        overwrite=request.overwrite
    )
    return _build_transform_response(
        request.file_id,
        "concat",
        request.new_column,
        columns_before,
        transformed_df,
        source
    )


@router.post(
    "/preprocessing/column/transform/calculate",
    response_model=APIResponse
)
def calculate_file_column(request: CalculateColumnRequest):
    df, source = load_working_dataframe(request.file_id)
    columns_before = len(df.columns)
    transformed_df = transform_columns(
        df=df,
        operation="calculate",
        columns=request.columns,
        new_column=request.new_column,
        formula=request.formula,
        keep_original=request.keep_original,
        overwrite=request.overwrite
    )
    return _build_transform_response(
        request.file_id,
        "calculate",
        request.new_column,
        columns_before,
        transformed_df,
        source
    )


@router.post(
    "/preprocessing/column/transform/recode",
    response_model=APIResponse
)
def recode_file_column(request: RecodeColumnRequest):
    df, source = load_working_dataframe(request.file_id)
    columns_before = len(df.columns)
    transformed_df = transform_columns(
        df=df,
        operation="recode",
        source_column=request.source_column,
        new_column=request.new_column,
        mapping=request.mapping,
        default_value=request.default_value,
        keep_original=request.keep_original,
        overwrite=request.overwrite
    )
    return _build_transform_response(
        request.file_id,
        "recode",
        request.new_column,
        columns_before,
        transformed_df,
        source
    )


@router.post(
    "/preprocessing/column/transform/binning",
    response_model=APIResponse
)
def bin_file_column(request: BinningColumnRequest):
    df, source = load_working_dataframe(request.file_id)
    columns_before = len(df.columns)
    transformed_df = transform_columns(
        df=df,
        operation="binning",
        source_column=request.source_column,
        new_column=request.new_column,
        bins=request.bins,
        default_value=request.default_value,
        keep_original=request.keep_original,
        overwrite=request.overwrite
    )
    return _build_transform_response(
        request.file_id,
        "binning",
        request.new_column,
        columns_before,
        transformed_df,
        source
    )
