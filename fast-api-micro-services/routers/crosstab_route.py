from typing import List
from fastapi import APIRouter, Query
from schemas.crosstab_schema import (
    CrosstabNormalizeMode,
    CrosstabResponseData,
)
from schemas.response_schema import ApiResponse
from services.crosstab_service import generate_crosstab, create_crosstab, clean_for_json
from services.minio_file_store_service import load_working_dataframe
from utils.response import APIResponse

router = APIRouter(tags=["Crosstab"])


@router.get("/crosstab/simple", response_model=ApiResponse)
def get_crosstab(
    file_id: str = Query(..., examples=["PUT_FILE_ID_HERE"]),
    row: str = Query(..., examples=["Q1_SAT", "COUNTRY", "SATISFACTION"]),
    column: str = Query(..., examples=["GENRE", "GENDER", "PRODUCT_TYPE"]),
    normalize: CrosstabNormalizeMode = Query(
        CrosstabNormalizeMode.NONE,
        examples=["none", "row", "column", "all"]
    ),
    include_totals: bool = Query(True),
    include_missing: bool = Query(False)
):
    df, source = load_working_dataframe(file_id)
    row_name = row.strip()
    column_name = column.strip()
    crosstab = generate_crosstab(
        df=df,
        row=row_name,
        column=column_name,
        normalize=normalize.value,
        include_totals=include_totals,
        include_missing=include_missing
    )
    result = CrosstabResponseData(
        file_id=file_id,
        source=source,
        row=row_name,
        column=column_name,
        normalize=normalize.value,
        include_totals=include_totals,
        include_missing=include_missing,
        row_categories=crosstab["row_categories"],
        column_categories=crosstab["column_categories"],
        table=crosstab["table"]
    )
    return APIResponse.ok(
        data=result,
        message="Crosstab generated successfully"
    )


@router.get("/crosstab/compute", response_model=ApiResponse)
def get_crosstab_compute(
    file_id: str = Query(...),
    row_cols: str = Query(..., description="Colonnes lignes séparées par virgule"),
    col_cols: str = Query("", description="Colonnes colonnes séparées par virgule"),
    values: str = Query(...),
    agg_func: str = Query("mean"),
    normalize: bool = Query(False)
):
    df, source = load_working_dataframe(file_id)
    row_list = [c.strip() for c in row_cols.split(",") if c.strip()]
    col_list = [c.strip() for c in col_cols.split(",") if c.strip()]

    result_df = create_crosstab(
        df=df,
        row_cols=row_list,
        col_cols=col_list,
        values=values,
        agg_func=agg_func,
        normalize=normalize
    )
    return APIResponse.ok(
        data=clean_for_json(result_df),
        message="Crosstab computed successfully"
    )