from typing import Any,Optional
from pydantic import BaseModel


class RecommendedColumn(BaseModel):
    column: str
    duplicate_rate: float
    reason: str

class AnalyzeDuplicatesResponseData(BaseModel):
    file_id: str
    total_rows: int
    duplicate_count: int        # était duplicate_rows
    unique_rows: int            # manquait
    duplicate_rate: float       # était duplicate_ratio
    duplicate_preview: list[dict[str, Any]]  # était preview
    subset_used: str | list[str]             # manquait


class RecommendDeduplicationResponseData(BaseModel):
    file_id: str
    recommended: list[RecommendedColumn]
    not_advised: list[RecommendedColumn]
    low_duplicate: list[RecommendedColumn]
    error: Optional[str] = None


class RemoveDuplicatesRequest(BaseModel):
    file_id: str
    subset: str | None = None
    keep: str = "first"


class RemoveDuplicatesResponseData(BaseModel):
    file_id: str
    message: str
    rows_before: int
    rows_after: int
    rows_removed: int
    preview: list[dict[str, Any]]
