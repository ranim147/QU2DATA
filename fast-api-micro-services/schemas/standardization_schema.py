from enum import StrEnum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class StandardizationMethod(StrEnum):
    Z_SCORE = "z_score"
    MIN_MAX = "min_max"
    ROBUST = "robust"


class StandardizationRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        use_enum_values=True,
        json_schema_extra={
            "examples": [
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["AGE"],
                    "method": "z_score"
                },
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["AGE", "WEIGHT", "HEIGHT"],
                    "method": "z_score"
                },
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["AGE"],
                    "method": "min_max"
                },
                {
                    "file_id": "PUT_FILE_ID_HERE",
                    "columns": ["AGE"],
                    "method": "robust"
                }
            ]
        }
    )

    file_id: str = Field(min_length=1)
    columns: list[str] = Field(min_length=1)
    method: StandardizationMethod
    preview_limit: int = Field(default=10, ge=1, le=500)


class StandardizationColumnResult(BaseModel):
    column: str
    stats_before: dict[str, Optional[float]]
    stats_after: dict[str, Optional[float]]


class StandardizationResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    method: str
    columns: list[str]
    results: list[StandardizationColumnResult]
    preview: list[dict[str, Any]]
