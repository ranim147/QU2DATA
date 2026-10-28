from copy import deepcopy
from threading import RLock
from typing import Any
from uuid import uuid4

import pandas as pd
from fastapi import HTTPException

from services.file_parser_service import clean_dataframe_for_json


FILE_STORE: dict[str, dict[str, Any]] = {}
FILE_STORE_LOCK = RLock()


def _dataframe_to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    cleaned_df = clean_dataframe_for_json(df.copy())
    return cleaned_df.to_dict(orient="records")


def save_file(
    filename: str,
    file_type: str,
    df: pd.DataFrame
) -> str:
    file_id = str(uuid4())
    records = _dataframe_to_records(df)

    stored_file = {
        "filename": filename,
        "file_type": file_type,
        "original_data": deepcopy(records),
        "current_data": deepcopy(records),
        "preview_data": None,
        "columns": list(df.columns),
        "rows": len(df),
        "missing_values": df.is_null().sum().astype(int).to_dict(),
        "dtypes": {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        }
    }

    with FILE_STORE_LOCK:
        FILE_STORE[file_id] = stored_file

    return file_id


def file_exists(file_id: str) -> bool:
    with FILE_STORE_LOCK:
        return file_id in FILE_STORE


def get_file(file_id: str) -> dict[str, Any]:
    with FILE_STORE_LOCK:
        stored_file = FILE_STORE.get(file_id)

        if stored_file is None:
            raise HTTPException(
                status_code=404,
                detail=f"File with id '{file_id}' was not found"
            )

        return deepcopy(stored_file)


def get_current_dataframe(file_id: str) -> pd.DataFrame:
    return load_current_dataframe(file_id)


def load_current_dataframe(file_id: str) -> pd.DataFrame:
    stored_file = get_file(file_id)
    return pd.DataFrame(
        stored_file["current_data"],
        columns=stored_file["columns"]
    )


def update_current_data(file_id: str, df: pd.DataFrame) -> None:
    save_current_dataframe(file_id, df)


def save_current_dataframe(file_id: str, df: pd.DataFrame) -> None:
    records = _dataframe_to_records(df)

    with FILE_STORE_LOCK:
        if file_id not in FILE_STORE:
            raise HTTPException(
                status_code=404,
                detail=f"File with id '{file_id}' was not found"
            )

        FILE_STORE[file_id]["current_data"] = records
        FILE_STORE[file_id]["columns"] = list(df.columns)
        FILE_STORE[file_id]["rows"] = len(df)
        FILE_STORE[file_id]["missing_values"] = (
            df.is_null().sum().astype(int).to_dict()
        )
        FILE_STORE[file_id]["dtypes"] = {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        }


def save_preview_dataframe(file_id: str, df: pd.DataFrame) -> None:
    records = _dataframe_to_records(df)

    with FILE_STORE_LOCK:
        if file_id not in FILE_STORE:
            raise HTTPException(
                status_code=404,
                detail=f"File with id '{file_id}' was not found"
            )

        FILE_STORE[file_id]["preview_data"] = records


def preview_exists(file_id: str) -> bool:
    with FILE_STORE_LOCK:
        if file_id not in FILE_STORE:
            raise HTTPException(
                status_code=404,
                detail=f"File with id '{file_id}' was not found"
            )

        return FILE_STORE[file_id].get("preview_data") is not None


def load_preview_dataframe(file_id: str) -> pd.DataFrame:
    with FILE_STORE_LOCK:
        stored_file = FILE_STORE.get(file_id)

        if stored_file is None:
            raise HTTPException(
                status_code=404,
                detail=f"File with id '{file_id}' was not found"
            )

        if stored_file.get("preview_data") is None:
            raise HTTPException(
                status_code=404,
                detail="No preview found for this file"
            )

        return pd.DataFrame(stored_file["preview_data"])


def load_working_dataframe(file_id: str) -> tuple[pd.DataFrame, str]:
    if preview_exists(file_id):
        return load_preview_dataframe(file_id), "preview.csv"

    return load_current_dataframe(file_id), "current.csv"


def commit_preview_to_current(file_id: str) -> dict[str, bool]:
    preview_df = load_preview_dataframe(file_id)
    records = _dataframe_to_records(preview_df)

    with FILE_STORE_LOCK:
        FILE_STORE[file_id]["current_data"] = records
        FILE_STORE[file_id]["columns"] = list(preview_df.columns)
        FILE_STORE[file_id]["rows"] = len(preview_df)
        FILE_STORE[file_id]["missing_values"] = (
            preview_df.is_null().sum().astype(int).to_dict()
        )
        FILE_STORE[file_id]["dtypes"] = {
            column: str(dtype)
            for column, dtype in preview_df.dtypes.items()
        }
        FILE_STORE[file_id]["preview_data"] = None

    return {
        "current_updated": True,
        "preview_deleted": True
    }


def list_files() -> list[dict[str, Any]]:
    with FILE_STORE_LOCK:
        return [
            {
                "file_id": file_id,
                "filename": stored_file["filename"],
                "file_type": stored_file["file_type"],
                "rows": stored_file["rows"],
                "columns": deepcopy(stored_file["columns"])
            }
            for file_id, stored_file in FILE_STORE.items()
        ]


def delete_file(file_id: str) -> bool:
    with FILE_STORE_LOCK:
        return FILE_STORE.pop(file_id, None) is not None


def reset_current_data(file_id: str) -> None:
    stored_file = get_file(file_id)
    original_df = pd.DataFrame(stored_file["original_data"])
    update_current_data(file_id, original_df)


def get_original_dataframe(file_id: str) -> pd.DataFrame:
    stored_file = get_file(file_id)
    return pd.DataFrame(stored_file["original_data"])


