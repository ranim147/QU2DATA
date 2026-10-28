from typing import Any
from pydantic import BaseModel


class ApplyTypeCorrectionRequest(BaseModel):
    dataset_id: str
    column: str
    target_type: str


class RecommendTypeCorrectionsResponseData(BaseModel):
    file_id: str
    recommendations: dict[str, Any]


class ApplyTypeCorrectionResponseData(BaseModel):
    file_id: str
    message: str
    column: str
    original_type: str
    new_type: str
    conversion_failures: int
    preview: list[dict[str, Any]]