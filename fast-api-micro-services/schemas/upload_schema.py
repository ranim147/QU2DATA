from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field


class FileUploadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    encrypted: bool = False
    dashboard_mode: Literal["libre", "guide", "auto"] = "auto"


class FileUploadResponseData(BaseModel):
    file_id: str
    filename: str
    source: Literal["excel", "csv", "google_sheets", "sql", "api"]
    rows: int
    size_kb: int
    status: Literal["ready", "warning", "error"]
    dashboard_mode: Literal["libre", "guide", "auto"]
    encrypted: bool
    columns: list[str]
    preview: list[dict[str, Any]]


class UploadResponseData(BaseModel):
    dataset_id: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    columns: list[str]
    dtypes: dict[str, str]
    missing_values: dict[str, int]
    preview: list[dict[str, Any]]
    file: dict[str, Any] | None = None


class GoogleSheetsConnectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sheet_url: str = Field(min_length=1)
    encrypted: bool = False
    dashboard_mode: Literal["libre", "guide", "auto"] = "auto"


class SQLConnectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    host: str = Field(min_length=1)
    port: int = Field(default=5432, gt=0, le=65535)
    database: str = Field(min_length=1)
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    query: str | None = None
    encrypted: bool = False
    dashboard_mode: Literal["libre", "guide", "auto"] = "auto"


class APIConnectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1)
    bearer_token: str | None = None
    pagination_key: str | None = None
    encrypted: bool = False
    dashboard_mode: Literal["libre", "guide", "auto"] = "auto"


class UploadHistoryItem(BaseModel):
    file_id: str
    filename: str
    source: Literal["excel", "csv", "google_sheets", "sql", "api"]
    status: Literal["ready", "warning", "error"]
    rows: int
    size_kb: int
    created_at: str
