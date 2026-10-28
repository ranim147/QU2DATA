"""Compatibility wrapper.

After the merge, we keep **only** `storage/dataset_store.py` as the MinIO storage
implementation to avoid contradictory logic.

This module keeps the previous import paths/signatures used by `routers/files_route.py`
by delegating to `storage.dataset_store`.
"""

from __future__ import annotations

import uuid
from typing import Any

import pandas as pd
from fastapi import HTTPException

import storage.dataset_store as storage_dataset_store

# Re-export dataset_store functions under the names historically used by older
# routers, while keeping the canonical dataset_id/stage signature.
apply_preview = storage_dataset_store.apply_preview
init_dataset = storage_dataset_store.init_dataset
dataset_exists = storage_dataset_store.dataset_exists




def _records_from_dataframe(df: pd.DataFrame) -> list[dict[str, Any]]:
    cleaned_df = df.astype(object).where(pd.notna(df), None)
    return cleaned_df.to_dict(orient="records")


def save_file(filename: str, file_type: str, df: pd.DataFrame) -> str:
    # storage.dataset_store uses dataset_id; we reuse it as file_id
    file_id = str(uuid.uuid4())
    init_dataset(file_id, df)
    return file_id


def get_dataset(dataset_id: str, stage: str = "current") -> pd.DataFrame:
    return storage_dataset_store.get_dataset(dataset_id, stage=stage)


def save_dataset(dataset_id: str, df: pd.DataFrame, stage: str = "current") -> None:
    storage_dataset_store.save_dataset(dataset_id, df, stage=stage)


def get_current_dataframe(file_id: str) -> pd.DataFrame:
    return load_current_dataframe(file_id)




def update_current_data(file_id: str, df: pd.DataFrame) -> None:
    save_current_dataframe(file_id, df)


def load_current_dataframe(file_id: str) -> pd.DataFrame:
    return get_dataset(file_id, stage="current")


def load_preview_dataframe(file_id: str) -> pd.DataFrame:
    return get_dataset(file_id, stage="preview")


def save_preview_dataframe(file_id: str, df: pd.DataFrame) -> None:
    if not dataset_exists(file_id, stage="current"):
        raise HTTPException(
            status_code=404,
            detail=f"File with id '{file_id}' was not found",
        )
    save_dataset(file_id, df, stage="preview")


def save_current_dataframe(file_id: str, df: pd.DataFrame) -> None:
    if not dataset_exists(file_id, stage="current"):
        raise HTTPException(
            status_code=404,
            detail=f"File with id '{file_id}' was not found",
        )
    save_dataset(file_id, df, stage="current")


def preview_exists(file_id: str) -> bool:
    if not dataset_exists(file_id, stage="current"):
        raise HTTPException(
            status_code=404,
            detail=f"File with id '{file_id}' was not found",
        )
    return dataset_exists(file_id, stage="preview")


def load_working_dataframe(file_id: str) -> tuple[pd.DataFrame, str]:
    if preview_exists(file_id):
        return load_preview_dataframe(file_id), "preview.csv"
    return load_current_dataframe(file_id), "current.csv"


def commit_preview_to_current(file_id: str) -> dict[str, bool]:
    if not preview_exists(file_id):
        raise HTTPException(status_code=404, detail="No preview found for this file")
    apply_preview(file_id)
    return {"current_updated": True, "preview_deleted": True}


def cancel_preview(file_id: str) -> None:
    storage_dataset_store.cancel_preview(file_id)



def get_file(file_id: str) -> dict[str, Any]:
    df = get_current_dataframe(file_id)
    return {
        "file_id": file_id,
        "rows": len(df),
        "columns": list(df.columns),
        "missing_values": df.isnull().sum().astype(int).to_dict(),
        "dtypes": {column: str(dtype) for column, dtype in df.dtypes.items()},
        "current_data": _records_from_dataframe(df),
        "has_preview": preview_exists(file_id),
    }
