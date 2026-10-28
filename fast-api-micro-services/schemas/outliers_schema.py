from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

MethodLiteral = Literal["zscore", "iqr", "grubbs"]
ActionLiteral = Literal["delete", "replace_median", "replace_mean", "mark", "ignore"]


class OutliersRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_id: str = Field(min_length=1)
    columns: list[str] | None = None
    method: MethodLiteral = "iqr"
    factor: float = Field(default=1.5, ge=0.01, le=10.0)

    @model_validator(mode="after")
    def validate_factor(self):
        if self.factor <= 0:
            raise ValueError("factor must be positive")
        return self


class ApplyOutliersRequest(BaseModel):
    dataset_id: str
    column: str
    action: str
    method: str = "iqr"
    factor: float = Field(default=1.5, ge=0.01, le=10.0)


class DetectOutliersResponseData(BaseModel):
    file_id: str
    results: dict[str, Any]  # ← corrigé


class ApplyOutliersResponseData(BaseModel):
    file_id: str
    message: str
    outliers_traites: int
    preview: list[dict[str, Any]]
