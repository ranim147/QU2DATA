from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BinningRule(BaseModel):
    label: str
    min: float
    max: float


class BaseColumnTransformRequest(BaseModel):
    file_id: str
    new_column: str
    keep_original: bool = True
    overwrite: bool = False


class ConcatColumnsRequest(BaseColumnTransformRequest):
    columns: List[str] = Field(min_length=2)
    separator: str = "-"


class CalculateColumnRequest(BaseColumnTransformRequest):
    formula: str
    columns: Optional[List[str]] = None


class RecodeColumnRequest(BaseColumnTransformRequest):
    source_column: str
    mapping: Dict[str, Any] = Field(min_length=1)
    default_value: Optional[Any] = None


class BinningColumnRequest(BaseColumnTransformRequest):
    source_column: str
    bins: List[BinningRule] = Field(min_length=1)
    default_value: Optional[Any] = None


class ColumnTransformResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    operation: str
    rows: int
    new_column: str
    columns_before: int
    columns_after: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    data: List[Dict[str, Any]]
