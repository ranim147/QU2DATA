from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
import polars as pl
import io
import uuid

from backend.storage.dataset_store import save_dataset

router = APIRouter(tags=["Upload"])


@router.post("/convert", summary="Convertir Excel en CSV")
async def convert_to_csv(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pl.read_excel(io.BytesIO(contents))
    except Exception as e:
        return {"error": f"Impossible de lire le fichier : {str(e)}"}

    csv_str = df.write_csv()
    filename = file.filename.replace(".xlsx", ".csv").replace(".xls", ".csv")
    return StreamingResponse(
        io.BytesIO(csv_str.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/upload", summary="Uploader un fichier CSV ou Excel")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()

    try:
        if file.filename.endswith(".csv"):
            df = pl.read_csv(io.BytesIO(content))
        elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            df = pl.read_excel(io.BytesIO(content))
        else:
            return {"error": "Format non supporté. Utilise CSV ou Excel."}
    except Exception as e:
        return {"error": f"Impossible de lire le fichier : {str(e)}"}

    dataset_id = str(uuid.uuid4())
    save_dataset(dataset_id, df)

    missing_values = {col: int(df[col].null_count()) for col in df.columns}
    dtypes = {col: str(df[col].dtype) for col in df.columns}

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "file_size_bytes": len(content),
        "row_count": df.height,
        "column_count": df.width,
        "columns": df.columns,
        "dtypes": dtypes,
        "missing_values": missing_values,
        "preview": df.head(5).to_dicts()
    }