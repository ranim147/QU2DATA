from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SamplingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_id: str = Field(min_length=1)
    size: float = Field(gt=0)
    seed: int = 42
    confidence: Literal[90, 95, 99] = 95


class SimpleRandomSampleRequest(SamplingRequest):
    size_mode: Literal["n", "percent"] = "n"

    @model_validator(mode="after")
    def validate_size(self):
        if self.size_mode == "percent" and self.size > 100:
            raise ValueError("Percentage size must be between 0 and 100")
        return self


class SystematicSampleRequest(SamplingRequest):
    size_mode: Literal["n", "percent", "k"] = "n"

    @model_validator(mode="after")
    def validate_size(self):
        if self.size_mode == "percent" and self.size > 100:
            raise ValueError("Percentage size must be between 0 and 100")
        if self.size_mode == "k" and self.size < 1:
            raise ValueError("Systematic interval k must be at least 1")
        return self


class SamplingResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    method: str
    total_rows: int
    sample_size: int
    size_mode: str
    size_value: float
    seed: int
    confidence: float

    k: Optional[int] = None
    offset: Optional[int] = None
    selected_indices: list[int]
    rows: int
    columns: list[str]
    preview: list[dict[str, Any]]
    data: list[dict[str, Any]]


class QuotaCellRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    values: dict[str, Any] = Field(min_length=1)
    target: int = Field(gt=0)


class QuotaSamplingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_id: str = Field(min_length=1)
    quota_columns: list[str] = Field(min_length=1)
    quotas: list[QuotaCellRequest] = Field(min_length=1)
    seed: int = 42
    confidence: Literal[90, 95, 99] = 95
    allow_underfilled: bool = False


class QuotaCellResponse(BaseModel):
    values: dict[str, Any]
    requested: int
    available: int
    selected: int
    underfilled: bool


class QuotaSamplingResponseData(BaseModel):
    file_id: str
    source: str
    output: str
    has_preview: bool
    method: str
    total_rows: int
    sample_size: int
    seed: int
    confidence: float
    quota_columns: list[str]
    quota_results: list[QuotaCellResponse]
    selected_indices: list[int]
    rows: int
    columns: list[str]
    preview: list[dict[str, Any]]
    data: list[dict[str, Any]]


# ── Stratified / Bootstrap (router actuel) ──────────────────────────────────

class StratifiedSamplingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_id: str = Field(min_length=1)
    strate_col: str = Field(min_length=1)
    n: Optional[int] = Field(default=None, gt=0)
    mode: Literal["proportionnel", "equilibre"] = "proportionnel"


class BootstrapSamplingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_id: str = Field(min_length=1)
    n: int = Field(gt=0)

class StratifiedSamplingResponseData(BaseModel):
    file_id: str
    message: str
    strate_col: str
    modalites: list[dict[str, Any]]
    rows_original: int
    rows_sampled: int
    marge_erreur: float
    niveau_confiance: float
    preview: list[dict[str, Any]]


class BootstrapSamplingResponseData(BaseModel):
    file_id: str
    message: str
    rows_original: int
    rows_sampled: int
    marge_erreur: float
    niveau_confiance: float
    preview: list[dict[str, Any]]
