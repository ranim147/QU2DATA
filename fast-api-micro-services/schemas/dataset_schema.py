from pydantic import BaseModel
from typing import Any


class ApplyPreviewRequest(BaseModel):
    dataset_id: str


class CancelPreviewRequest(BaseModel):
    dataset_id: str


class ApplyPreviewResponseData(BaseModel):
    file_id: str
    rows: int
    preview: list[dict[str, Any]]


class CancelPreviewResponseData(BaseModel):
    file_id: str