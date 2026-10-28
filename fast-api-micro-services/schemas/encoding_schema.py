from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class OneHotEncodingRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["COLOR"],
                    "drop_first": False,
                    "drop_original": True
                },
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["COUNTRY", "GENDER"],
                    "drop_first": True,
                    "drop_original": True
                }
            ]
        }
    )

    file_id: str = Field(min_length=1)
    columns: list[str] = Field(min_length=1)
    drop_first: bool = False
    drop_original: bool = True
    preview_limit: int = Field(default=10, ge=1, le=500)


class OneHotEncodingResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    columns: list[str]
    drop_first: bool
    drop_original: bool
    created_columns: dict[str, list[str]]
    preview: list[dict[str, Any]]
