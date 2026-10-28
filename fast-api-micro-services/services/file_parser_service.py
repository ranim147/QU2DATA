import csv
import io
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import UploadFile, HTTPException


def detect_csv_separator(content: bytes) -> str:
    sample = content[:4096].decode("utf-8", errors="ignore")

    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=[",", ";", "\t", "|"])
        return dialect.delimiter
    except Exception:
        return ","


async def parse_file_to_dataframe(
    file: UploadFile,
    sheet_name: Optional[str] = None
) -> tuple[pd.DataFrame, str]:
    filename = file.filename or ""
    lowered_filename = filename.lower()

    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    content = await file.read()

    try:
        if lowered_filename.endswith(".csv"):
            separator = detect_csv_separator(content)

            df = pd.read_csv(
                io.BytesIO(content),
                sep=separator
            )

            file_type = "csv"

        elif (
            lowered_filename.endswith(".xlsx")
            or lowered_filename.endswith(".xls")
        ):
            df = pd.read_excel(
                io.BytesIO(content),
                sheet_name=sheet_name if sheet_name else 0
            )
            file_type = "excel"

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Use CSV, XLSX, or XLS."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error while reading file: {str(e)}"
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    return df, file_type


def clean_dataframe_for_json(df: pd.DataFrame) -> pd.DataFrame:
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.astype(object).where(pd.notnull(df), None)
    return df
