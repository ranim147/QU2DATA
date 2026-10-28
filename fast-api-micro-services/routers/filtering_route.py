from fastapi import APIRouter

from utils.dataframe_utils import (
    persist_transformation_result,
    records_from_dataframe,
)
from schemas.row_filter_schema import (
    RowFilterRequest,
    RowFilterResponseData,
    RowSortRequest,
    RowSortResponseData,
    RowViewRequest,
    RowViewResponseData,
)
from services.filtering_service import (
    apply_row_filters,
    apply_sort,
    paginate_dataframe,
)
from services.minio_file_store_service import load_working_dataframe
from utils.response import APIResponse


router = APIRouter(tags=["Row Operations"])


@router.post("/preprocessing/row/filter", response_model=APIResponse)
def filter_rows(request: RowFilterRequest):
    df, source = load_working_dataframe(request.file_id)
    rows_before = len(df)
    filtered_df = apply_row_filters(
        df,
        request.conditions,
        request.logic
    )
    paginated_df, total_pages = paginate_dataframe(
        filtered_df,
        request.page,
        request.page_size
    )
    records = records_from_dataframe(paginated_df)
    persistence = persist_transformation_result(
        request.file_id,
        filtered_df,
       
    )

    result = RowFilterResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        rows_before=rows_before,
        rows_after=len(filtered_df),
        removed_rows=rows_before - len(filtered_df),
        logic=request.logic,
        conditions=[
            condition.model_dump()
            for condition in request.conditions
        ],
        page=request.page,
        page_size=request.page_size,
        total_pages=total_pages,
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
    data=result,
    message="Rows filtered successfully"
)


@router.post("/preprocessing/row/sort", response_model=APIResponse)
def sort_rows(request: RowSortRequest):
    df, source = load_working_dataframe(request.file_id)
    sorted_df = apply_sort(df, request.sort_by)
    paginated_df, total_pages = paginate_dataframe(
        sorted_df,
        request.page,
        request.page_size
    )
    records = records_from_dataframe(paginated_df)
    persistence = persist_transformation_result(
        request.file_id,
        sorted_df,
        
    )

    result = RowSortResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        rows=len(sorted_df),
        sort_by=[rule.model_dump() for rule in request.sort_by],
        page=request.page,
        page_size=request.page_size,
        total_pages=total_pages,
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
        data=result,
        message="Rows sorted successfully"
    )


@router.post("/preprocessing/row/view", response_model=APIResponse)
def view_rows(request: RowViewRequest):
    df, source = load_working_dataframe(request.file_id)
    rows_before = len(df)
    filtered_df = apply_row_filters(
        df,
        request.conditions,
        request.logic
    )
    sorted_df = apply_sort(filtered_df, request.sort_by)
    paginated_df, total_pages = paginate_dataframe(
        sorted_df,
        request.page,
        request.page_size
    )
    records = records_from_dataframe(paginated_df)
    persistence = persist_transformation_result(
        request.file_id,
        sorted_df,
        
    )

    result = RowViewResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        rows_before=rows_before,
        rows_after_filter=len(filtered_df),
        conditions=[
            condition.model_dump()
            for condition in request.conditions
        ],
        logic=request.logic,
        sort_by=[rule.model_dump() for rule in request.sort_by],
        page=request.page,
        page_size=request.page_size,
        total_pages=total_pages,
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
    data=result,
    message="Data view generated successfully"
)
