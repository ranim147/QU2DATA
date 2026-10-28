from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MergeOperation(str, Enum):
    CONCAT_VERTICAL = "CONCAT_VERTICAL"
    JOIN_BY_KEY = "JOIN_BY_KEY"
    UPSERT = "UPSERT"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class JoinType(str, Enum):
    INNER = "inner"
    LEFT = "left"
    OUTER = "outer"


class FileMergeBaseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    left_file_id: str = Field(min_length=1)
    right_file_id: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_distinct_files(self):
        if self.left_file_id == self.right_file_id:
            raise ValueError("Source file IDs must be different")
        return self


class FileMergeRecommendRequest(FileMergeBaseRequest):
    pass


class FileMergeConfiguration(FileMergeBaseRequest):
    operation: MergeOperation
    column_mapping: dict[str, str] = Field(default_factory=dict)
    join_keys: list[str] = Field(default_factory=list)
    join_type: JoinType = JoinType.LEFT
    add_source_column: bool = True
    source_column_name: str = Field(default="_source_file", min_length=1)
    left_source_label: str | None = Field(default=None, min_length=1)
    right_source_label: str | None = Field(default=None, min_length=1)
    preview_limit: int = Field(default=20, ge=1, le=100)
    right_precedence: bool = True
    update_non_null_only: bool = True

    @model_validator(mode="after")
    def validate_operation_configuration(self):
        if self.operation == MergeOperation.MANUAL_REVIEW:
            raise ValueError("MANUAL_REVIEW cannot be executed")
        if self.operation in {
            MergeOperation.JOIN_BY_KEY,
            MergeOperation.UPSERT,
        } and not self.join_keys:
            raise ValueError("At least one join key is required")
        if len(self.join_keys) != len(set(self.join_keys)):
            raise ValueError("Join keys must be unique")
        return self


class TypeConflict(BaseModel):
    column: str
    left_type: str
    right_type: str


class KeyCandidate(BaseModel):
    columns: list[str]
    left_uniqueness: float
    right_uniqueness: float
    overlap_score: float
    duplicate_risk: str


class DatasetShape(BaseModel):
    rows: int
    columns: int


class FileMergeRecommendationData(BaseModel):
    recommended_operation: MergeOperation
    confidence_score: float
    reasons: list[str]
    warnings: list[str]
    common_columns: list[str]
    left_only_columns: list[str]
    right_only_columns: list[str]
    left_dtypes: dict[str, str]
    right_dtypes: dict[str, str]
    type_conflicts: list[TypeConflict]
    candidate_keys: list[KeyCandidate]
    operation_scores: dict[str, float]
    schema_similarity: float
    left_shape: DatasetShape
    right_shape: DatasetShape


class MergeStatistics(BaseModel):
    left_rows: int
    right_rows: int
    result_rows: int
    matched_left_rows: int | None = None
    unmatched_left_rows: int | None = None
    matched_right_rows: int | None = None
    unmatched_right_rows: int | None = None
    updated_rows: int | None = None
    inserted_rows: int | None = None
    left_duplicate_keys: int | None = None
    right_duplicate_keys: int | None = None


class FileMergePreviewData(BaseModel):
    operation: MergeOperation
    columns: list[str]
    rows: int
    preview: list[dict[str, Any]]
    warnings: list[str]
    type_conflicts: list[TypeConflict]
    statistics: MergeStatistics


class FileMergeExecuteData(FileMergePreviewData):
    dataset_id: str
    left_file_id: str
    right_file_id: str
    created_objects: list[str]
