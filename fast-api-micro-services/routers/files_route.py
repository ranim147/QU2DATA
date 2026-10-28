from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from starlette.exceptions import HTTPException as StarletteHTTPException
from schemas.file_schema import FileUploadResponseData
from utils.response import APIResponse
from services.file_parser_service import parse_file_to_dataframe
from services.minio_file_store_service import (
    commit_preview_to_current,
    load_current_dataframe,
    load_preview_dataframe,
    preview_exists,
    save_file,
)
from utils.dataframe_utils import records_from_dataframe
from services.minio_file_store_service import get_dataset


router = APIRouter(tags=["Files"])


async def _upload_and_store_file(
    file: UploadFile,
    sheet_name: Optional[str]
) -> FileUploadResponseData:
    df, file_type = await parse_file_to_dataframe(file, sheet_name)
    filename = file.filename or ""
    file_id = save_file(filename, file_type, df)
    records = records_from_dataframe(df)

    return FileUploadResponseData(
        file_id=file_id,
        filename=filename,
        file_type=file_type,
        rows=len(df),
        columns=list(df.columns),
        missing_values=df.isnull().sum().astype(int).to_dict(),
        dtypes={column: str(dtype) for column, dtype in df.dtypes.items()},
        preview=records[:5]
    )


#@router.post("/files/upload", response_model=APIResponse)
#async def upload_file(
#    file: UploadFile = File(..., description="CSV or Excel file"),
 #   sheet_name: Optional[str] = Form(
 #       None,
#        description="Excel sheet name. Leave empty for CSV."
 #   )
#):
 #   result = await _upload_and_store_file(file, sheet_name)
# return APIResponse.ok(
 #   data=data,
  #  message="File uploaded"
#)


@router.post(
    "/files/convert-to-json",
    response_model=APIResponse,
    deprecated=True
)
async def convert_file_to_json(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    preview_limit: int = Form(1000, ge=1)
):
    result = await _upload_and_store_file(file, sheet_name)
    data = result.model_dump()

    if preview_limit != 5:
        df = load_current_dataframe(result.file_id)
        data["preview"] = records_from_dataframe(df)[:preview_limit]

        return APIResponse.ok(
            data=data,
            message="File uploaded and parsed successfully"
        )


@router.get("/files/{file_id}/preview", response_model=APIResponse)
def get_file_preview(file_id: str, preview_limit: int = 5):
    if not preview_exists(file_id):
        raise StarletteHTTPException(
            status_code=404,
            detail="No preview found for this file"
        )

    df = load_preview_dataframe(file_id)
    records = records_from_dataframe(df)

    return APIResponse.ok(
    data={
        "file_id": file_id,
        "has_preview": True,
        "rows": len(df),
        "columns": list(df.columns),
        "preview": records[:preview_limit]
    },
    message="Preview loaded successfully"
)


@router.get("/files/{file_id}/current", response_model=APIResponse)
def get_file_current(file_id: str, preview_limit: int = 5):
    df = load_current_dataframe(file_id)
    records = records_from_dataframe(df)

    return APIResponse.ok(
    data={
        "file_id": file_id,
        "rows": len(df),
        "columns": list(df.columns),
        "preview": records[:preview_limit]
    },
    message="Current dataset loaded successfully"
)


@router.get("/files/{file_id}/columns", response_model=APIResponse)
def get_file_columns(file_id: str):
    df =get_dataset(file_id)

    return APIResponse.ok(
        data={
            "file_id": file_id,
            "columns": list(df.columns)
        },
        message="Columns loaded successfully"
    )


@router.get("/files/{file_id}/dtypes", response_model=APIResponse)
def get_file_dtypes(file_id: str):
    df =get_dataset(file_id)

    return APIResponse.ok(
    data={
        "file_id": file_id,
        "dtypes": {column: str(dtype) for column, dtype in df.dtypes.items()}
    },
    message="Column types loaded successfully"
)


@router.get("/files/{file_id}/has-preview", response_model=APIResponse)
def has_file_preview(file_id: str):
    return APIResponse.ok(
    data={
        "file_id": file_id,
        "has_preview": preview_exists(file_id)
    },
    message="Preview status loaded successfully"
)


@router.post("/files/{file_id}/save-preview", response_model=APIResponse)
def save_file_preview(file_id: str):
    result = commit_preview_to_current(file_id)

    return APIResponse.ok(
    data={
        "file_id": file_id,
        **result
    },
    message="Preview saved to current successfully"
)
