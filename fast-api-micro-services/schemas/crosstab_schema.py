from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class CrosstabRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    file_id: str = Field(min_length=1)
    row_column: str = Field(min_length=1)
    col_column: str = Field(min_length=1)
    value_column: str | None = None
    aggfunc: Literal["count", "sum", "mean", "min", "max"] = "count"
    normalize: Literal["index", "columns", "all"] | None = None


class CrosstabNormalizeMode(StrEnum):
    NONE = "none"
    ROW = "row"
    COLUMN = "column"
    ALL = "all"


class CrosstabResponseData(BaseModel):
    file_id: str
    row_column: str | None = None
    col_column: str | None = None
    value_column: str | None = None
    aggfunc: str | None = None
    normalize: str | None = None
    index: list[Any] = Field(default_factory=list)
    columns: list[Any] = Field(default_factory=list)
    data: list[dict[str, Any]] = Field(default_factory=list)
    source: str | None = None
    row: str | None = None
    column: str | None = None
    include_totals: bool | None = None
    include_missing: bool | None = None
    row_categories: list[str] = Field(default_factory=list)
    column_categories: list[str] = Field(default_factory=list)
    table: list[dict[str, Any]] = Field(default_factory=list)
