from typing import Any
from pydantic import BaseModel


class ApplyLogTransformRequest(BaseModel):
    dataset_id: str
    column: str
    method: str = "log1p"
    action: str = "replace"


class DetectLogTransformResponseData(BaseModel):
    file_id: str
    results: dict[str, Any]


class ApplyLogTransformResponseData(BaseModel):
    file_id: str
    message: str
    preview: list[dict[str, Any]]