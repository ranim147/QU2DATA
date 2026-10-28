from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ImputationByFileRequest(BaseModel):
    file_id: str
    method: Literal["mean", "median", "mode", "knn"]
    columns: Optional[List[str]] = None
    n_neighbors: int = Field(default=5, ge=1)


class ColumnProfile(BaseModel):
    name: str
    dtype: str
    missing_count: int
    missing_percentage: float
    allowed_methods: List[str]
    recommended: bool
    reason: str


class DataProfileResponseData(BaseModel):
    file_id: str
    rows: int
    columns: List[ColumnProfile]


class ImputationResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    method: str
    rows: int
    columns: List[str]
    imputed_columns: List[str]
    missing_before: Dict[str, int]
    missing_after: Dict[str, int]
    preview: List[Dict[str, Any]]
    data: List[Dict[str, Any]]
