from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import polars as pl
import pandas as pd
import io
import uuid

from storage.dataset_store import init_dataset
from utils.response import APIResponse
from schemas.upload_schema import UploadResponseData

router = APIRouter(tags=["Upload"])


@router.post("/convert", summary="Convertir Excel en CSV")
async def convert_to_csv(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pl.read_excel(io.BytesIO(contents))
    except Exception as e:
        return APIResponse.fail(f"Impossible de lire le fichier : {str(e)}")

    csv_str = df.write_csv()
    filename = file.filename.replace(".xlsx", ".csv").replace(".xls", ".csv")
    return StreamingResponse(
        io.BytesIO(csv_str.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/upload", response_model=APIResponse[UploadResponseData], summary="Uploader un fichier CSV ou Excel")
async def upload_file(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
):
    content = await file.read()
    filename = file.filename or ""

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            return APIResponse.fail("Format non supporté. Utilise CSV ou Excel.")
    except Exception as e:
        return APIResponse.fail(f"Impossible de lire le fichier : {str(e)}")

    dataset_id = str(uuid.uuid4())
    init_dataset(dataset_id, df)


    return APIResponse.ok(UploadResponseData(
        dataset_id=dataset_id,
        filename=filename,
        file_size_bytes=len(content),
        row_count=len(df),
        column_count=len(df.columns),
        columns=list(df.columns),
        dtypes={col: str(dtype) for col, dtype in df.dtypes.items()},
        missing_values=df.isnull().sum().astype(int).to_dict(),
        preview=df.head(5).to_dict(orient="records"),
    ))
