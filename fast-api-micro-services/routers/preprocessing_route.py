from fastapi import APIRouter

from utils.dataframe_utils import (
    persist_transformation_result,
    records_from_dataframe,
)
from schemas.encoding_schema import (
    OneHotEncodingRequest,
    OneHotEncodingResponseData,
)
from schemas.normalization_schema import (
    NormalizationRequest,
    NormalizationResponseData,
)
from schemas.preprocessing_schema import (
    ImputationByFileRequest,
    ImputationResponseData,
)
from utils.response import APIResponse
from schemas.standardization_schema import (
    StandardizationRequest,
    StandardizationResponseData,
)
from services.encoding_service import apply_one_hot_encoding
from services.imputation_service import apply_imputation
from services.normalization_service import apply_normalization
from services.standardization_service import apply_standardization
from services.minio_file_store_service import (
    load_working_dataframe,
    save_preview_dataframe,
)


router = APIRouter(tags=["Preprocessing"])


@router.post("/preprocessing/impute", response_model=APIResponse)
def impute_data(request: ImputationByFileRequest):
    df, source = load_working_dataframe(request.file_id)
    missing_before = df.isnull().sum().astype(int).to_dict()

    transformed_df, imputed_columns = apply_imputation(
        df=df.copy(),
        method=request.method,
        columns=request.columns,
        n_neighbors=request.n_neighbors
    )
    missing_after = transformed_df.isnull().sum().astype(int).to_dict()

    persistence = persist_transformation_result(
        request.file_id,
        transformed_df,
    )

    records = records_from_dataframe(transformed_df)
    result = ImputationResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        method=request.method,
        rows=len(transformed_df),
        columns=list(transformed_df.columns),
        imputed_columns=imputed_columns,
        missing_before=missing_before,
        missing_after=missing_after,
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
    data=result,
    message="Imputation generated successfully in preview"
)


@router.post("/preprocessing/standardize", response_model=APIResponse)
def standardize_column(request: StandardizationRequest):
    df, source = load_working_dataframe(request.file_id)
    transformed_df, results, preview = apply_standardization(
        df=df,
        columns=request.columns,
        method=request.method,
        preview_limit=request.preview_limit
    )
    save_preview_dataframe(request.file_id, transformed_df)

    result = StandardizationResponseData(
        file_id=request.file_id,
        source=source,
        output="preview.csv",
        has_preview=True,
        method=request.method,
        columns=[column_result["column"] for column_result in results],
        results=results,
        preview=preview
    )
    return APIResponse.ok(
    data=result,
    message="Columns standardized successfully in preview"
)  
    


@router.post("/preprocessing/normalize", response_model=APIResponse)
def normalize_columns(request: NormalizationRequest):
    df, source = load_working_dataframe(request.file_id)
    transformed_df, results, preview = apply_normalization(
        df=df,
        columns=request.columns,
        preview_limit=request.preview_limit
    )
    save_preview_dataframe(request.file_id, transformed_df)

    result = NormalizationResponseData(
        file_id=request.file_id,
        source=source,
        output="preview.csv",
        has_preview=True,
        columns=[column_result["column"] for column_result in results],
        results=results,
        preview=preview
    )
    return APIResponse.ok(
        data=result,
        message="Columns normalized successfully in preview"
    )


@router.post("/preprocessing/one-hot-encode", response_model=APIResponse)
def one_hot_encode_columns(request: OneHotEncodingRequest):
    df, source = load_working_dataframe(request.file_id)
    transformed_df, created_columns, preview = apply_one_hot_encoding(
        df=df,
        columns=request.columns,
        drop_first=request.drop_first,
        drop_original=request.drop_original,
        preview_limit=request.preview_limit
    )
    save_preview_dataframe(request.file_id, transformed_df)

    result = OneHotEncodingResponseData(
        file_id=request.file_id,
        source=source,
        output="preview.csv",
        has_preview=True,
        columns=list(created_columns.keys()),
        drop_first=request.drop_first,
        drop_original=request.drop_original,
        created_columns=created_columns,
        preview=preview
    )
    return APIResponse.ok(
    data=result,
    message="Columns one-hot encoded successfully in preview"
)
