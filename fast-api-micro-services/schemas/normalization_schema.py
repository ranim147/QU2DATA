from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class NormalizationRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["AGE"]
                },
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["AGE", "SALARY", "HEIGHT"]
                }
            ]
        }
    )

    file_id: str = Field(min_length=1)
    columns: list[str] = Field(min_length=1)
    preview_limit: int = Field(default=10, ge=1, le=500)


class NormalizationColumnResult(BaseModel):
    column: str
    stats_before: dict[str, Optional[float]]
    stats_after: dict[str, Optional[float]]


class NormalizationResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    columns: list[str]
    results: list[NormalizationColumnResult]
    preview: list[dict[str, Any]]
