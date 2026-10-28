from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


FilterOperator = Literal[
    "=",
    "!=",
    ">",
    ">=",
    "<",
    "<=",
    "between",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "in",
    "is_null",
    "is_not_null"
]


class StrictRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class FilterCondition(StrictRequestModel):
    column: str = Field(min_length=1)
    operator: FilterOperator
    value: Optional[Any] = None


class SortRule(StrictRequestModel):
    column: str = Field(min_length=1)
    direction: Literal["asc", "desc"]


class PaginationRequest(StrictRequestModel):
    file_id: str = Field(min_length=1)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=500)


class RowFilterRequest(PaginationRequest):
    conditions: List[FilterCondition] = Field(min_length=1)
    logic: Literal["AND", "OR"] = "AND"


class RowSortRequest(PaginationRequest):
    sort_by: List[SortRule] = Field(min_length=1)


class RowViewRequest(PaginationRequest):
    conditions: List[FilterCondition] = Field(default_factory=list)
    logic: Literal["AND", "OR"] = "AND"
    sort_by: List[SortRule] = Field(default_factory=list)


class RowFilterResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    rows_before: int
    rows_after: int
    removed_rows: int
    logic: str
    conditions: List[Dict[str, Any]]
    page: int
    page_size: int
    total_pages: int
    preview: List[Dict[str, Any]]
    data: List[Dict[str, Any]]


class RowSortResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    rows: int
    sort_by: List[Dict[str, Any]]
    page: int
    page_size: int
    total_pages: int
    preview: List[Dict[str, Any]]
    data: List[Dict[str, Any]]


class RowViewResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    rows_before: int
    rows_after_filter: int
    conditions: List[Dict[str, Any]]
    logic: str
    sort_by: List[Dict[str, Any]]
    page: int
    page_size: int
    total_pages: int
    preview: List[Dict[str, Any]]
    data: List[Dict[str, Any]]
