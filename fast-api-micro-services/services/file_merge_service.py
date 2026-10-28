from dataclasses import dataclass
from itertools import combinations
from typing import Any

import pandas as pd
from pandas.api import types as pandas_types

from schemas.file_merge_schema import (
    FileMergeConfiguration,
    MergeOperation,
)
from services.file_parser_service import clean_dataframe_for_json


class FileMergeValidationError(ValueError):
    pass


@dataclass
class MergeResult:
    dataframe: pd.DataFrame
    warnings: list[str]
    type_conflicts: list[dict[str, str]]
    statistics: dict[str, int | None]


def validate_source_dataframe(df: pd.DataFrame, label: str) -> None:
    if len(df.columns) == 0:
        raise FileMergeValidationError(f"{label} dataset has no columns")
    if df.empty:
        raise FileMergeValidationError(f"{label} dataset is empty")
    if len(df.columns) != len(set(df.columns)):
        raise FileMergeValidationError(
            f"{label} dataset contains duplicate column names"
        )


def dataframe_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return clean_dataframe_for_json(df.copy()).to_dict(orient="records")


def _dtype_family(series: pd.Series) -> str:
    dtype = series.dtype
    if pandas_types.is_bool_dtype(dtype):
        return "boolean"
    if pandas_types.is_numeric_dtype(dtype):
        return "numeric"
    if pandas_types.is_datetime64_any_dtype(dtype):
        return "datetime"
    if pandas_types.is_string_dtype(dtype) or pandas_types.is_object_dtype(dtype):
        return "text"
    return str(dtype)


def _type_conflicts(
    left: pd.DataFrame,
    right: pd.DataFrame,
    columns: list[str] | None = None,
) -> list[dict[str, str]]:
    inspected = columns or sorted(set(left.columns) & set(right.columns))
    conflicts = []
    for column in inspected:
        left_family = _dtype_family(left[column])
        right_family = _dtype_family(right[column])
        if left_family != right_family:
            conflicts.append({
                "column": column,
                "left_type": str(left[column].dtype),
                "right_type": str(right[column].dtype),
            })
    return conflicts


def _uniqueness(df: pd.DataFrame, columns: list[str]) -> float:
    valid = df[columns].dropna()
    if valid.empty:
        return 0.0
    return round(valid.drop_duplicates().shape[0] / len(valid), 4)


def _key_values(df: pd.DataFrame, columns: list[str]) -> set[tuple[Any, ...]]:
    values = df[columns].dropna().drop_duplicates()
    return set(values.itertuples(index=False, name=None))


def _overlap(left: pd.DataFrame, right: pd.DataFrame, columns: list[str]) -> float:
    left_values = _key_values(left, columns)
    right_values = _key_values(right, columns)
    union = left_values | right_values
    if not union:
        return 0.0
    return round(len(left_values & right_values) / len(union), 4)


def _candidate_keys(
    left: pd.DataFrame,
    right: pd.DataFrame,
    common_columns: list[str],
) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    candidates_to_check = [[column] for column in common_columns]

    ranked_singles = sorted(
        common_columns,
        key=lambda column: min(
            _uniqueness(left, [column]),
            _uniqueness(right, [column]),
        ),
        reverse=True,
    )[:8]
    candidates_to_check.extend(
        [list(pair) for pair in combinations(ranked_singles, 2)]
    )

    for columns in candidates_to_check:
        left_uniqueness = _uniqueness(left, columns)
        right_uniqueness = _uniqueness(right, columns)
        overlap_score = _overlap(left, right, columns)
        # Une candidate est rejetée si l’unicité minimale entre les deux fichiers est inférieure à 0,7
        minimum_uniqueness = min(left_uniqueness, right_uniqueness)
        if minimum_uniqueness < 0.7:
            continue

        if minimum_uniqueness == 1:
            duplicate_risk = "LOW"
        elif minimum_uniqueness >= 0.9:
            duplicate_risk = "MEDIUM"
        else:
            duplicate_risk = "HIGH"

        candidates.append({
            "columns": columns,
            "left_uniqueness": left_uniqueness,
            "right_uniqueness": right_uniqueness,
            "overlap_score": overlap_score,
            "duplicate_risk": duplicate_risk,
        })

    return sorted(
        candidates,
        key=lambda item: (
            min(item["left_uniqueness"], item["right_uniqueness"]),
            item["overlap_score"],
            -len(item["columns"]),
        ),
        reverse=True,
    )[:10]

#***Calcul de la similarité des schémas***
def recommend_merge(left: pd.DataFrame, right: pd.DataFrame) -> dict[str, Any]:
    validate_source_dataframe(left, "Left")
    validate_source_dataframe(right, "Right")

    left_columns = set(left.columns)
    right_columns = set(right.columns)
    common_columns = sorted(left_columns & right_columns)
    left_only = sorted(left_columns - right_columns)
    right_only = sorted(right_columns - left_columns)
    union_columns = left_columns | right_columns
    schema_similarity = round(
        len(common_columns) / len(union_columns) if union_columns else 0.0,
        4,
    )
    conflicts = _type_conflicts(left, right, common_columns)
    candidates = _candidate_keys(left, right, common_columns)

#La proportion de conflits
    conflict_ratio = len(conflicts) / max(len(common_columns), 1)
    best_candidate = candidates[0] if candidates else None
    key_quality = (
        min(
            best_candidate["left_uniqueness"],
            best_candidate["right_uniqueness"],
        )
        if best_candidate
        else 0.0
    )
    key_overlap = best_candidate["overlap_score"] if best_candidate else 0.0

    scores = {
        MergeOperation.CONCAT_VERTICAL.value: (
            0.15
            + 0.7 * schema_similarity
            - 0.35 * conflict_ratio
            - 0.2 * key_overlap
        ),
        MergeOperation.JOIN_BY_KEY.value: (
            0.05
            + 0.45 * key_quality
            + 0.35 * key_overlap
            + 0.15 * (1 - schema_similarity)
        ),
        MergeOperation.UPSERT.value: (
            0.05
            + 0.45 * key_quality
            + 0.45 * key_overlap
        ),
        MergeOperation.MANUAL_REVIEW.value: (
            0.1
            + 0.55 * (1 - schema_similarity)
            + 0.5 * conflict_ratio
            + (0.15 if not candidates else 0)
        ),
    }
    scores = {
        operation: round(max(0.0, min(1.0, score)), 4)
        for operation, score in scores.items()
    }
    #Choix final
    recommended = max(scores, key=scores.get)
    ordered_scores = sorted(scores.values(), reverse=True)
    margin = (
        ordered_scores[0] - ordered_scores[1]
        if len(ordered_scores) > 1
        else ordered_scores[0]
    )
    confidence = round(min(1.0, 0.55 + margin), 4)

    reasons = [
        f"Schema similarity is {schema_similarity:.1%}.",
        f"{len(common_columns)} common column(s) were found.",
    ]
    warnings: list[str] = []
    if best_candidate:
        reasons.append(
            "Best key candidate "
            f"{best_candidate['columns']} has "
            f"{best_candidate['overlap_score']:.1%} value overlap."
        )
    else:
        warnings.append("No sufficiently unique common key was detected.")
    if conflicts:
        warnings.append(
            f"{len(conflicts)} incompatible common-column type conflict(s) detected."
        )
    if left.duplicated().any() or right.duplicated().any():
        warnings.append("Exact duplicate rows exist in at least one source dataset.")
    if best_candidate and best_candidate["duplicate_risk"] != "LOW":
        warnings.append("The best key candidate contains duplicate values.")

    reasons.append(
        f"{recommended} received the highest deterministic score."
    )

    return {
        "recommended_operation": recommended,
        "confidence_score": confidence,
        "reasons": reasons,
        "warnings": warnings,
        "common_columns": common_columns,
        "left_only_columns": left_only,
        "right_only_columns": right_only,
        "left_dtypes": {
            column: str(dtype) for column, dtype in left.dtypes.items()
        },
        "right_dtypes": {
            column: str(dtype) for column, dtype in right.dtypes.items()
        },
        "type_conflicts": conflicts,
        "candidate_keys": candidates,
        "operation_scores": scores,
        "schema_similarity": schema_similarity,
        "left_shape": {"rows": len(left), "columns": len(left.columns)},
        "right_shape": {"rows": len(right), "columns": len(right.columns)},
    }


def _apply_column_mapping(
    right: pd.DataFrame,
    mapping: dict[str, str],
) -> pd.DataFrame:
    unknown = sorted(set(mapping) - set(right.columns))
    if unknown:
        raise FileMergeValidationError(
            f"Column mapping references unknown right column(s): {unknown}"
        )
    if any(not target.strip() for target in mapping.values()):
        raise FileMergeValidationError("Mapped column names cannot be empty")

    renamed_columns = [mapping.get(column, column) for column in right.columns]
    duplicates = sorted({
        column for column in renamed_columns if renamed_columns.count(column) > 1
    })
    if duplicates:
        raise FileMergeValidationError(
            f"Column mapping creates duplicate column name(s): {duplicates}"
        )

    return right.rename(columns=mapping).copy()


def _validate_join_keys(
    left: pd.DataFrame,
    right: pd.DataFrame,
    keys: list[str],
) -> None:
    missing_left = sorted(set(keys) - set(left.columns))
    missing_right = sorted(set(keys) - set(right.columns))
    if missing_left or missing_right:
        raise FileMergeValidationError(
            "Join key(s) missing from source datasets: "
            f"left={missing_left}, right={missing_right}"
        )
    if left[keys].isnull().any(axis=None) or right[keys].isnull().any(axis=None):
        raise FileMergeValidationError("Join keys cannot contain null values")

    conflicts = _type_conflicts(left, right, keys)
    if conflicts:
        columns = [conflict["column"] for conflict in conflicts]
        raise FileMergeValidationError(
            f"Join key type conflict(s): {columns}"
        )


def _duplicate_key_rows(df: pd.DataFrame, keys: list[str]) -> int:
    return int(df.duplicated(subset=keys, keep=False).sum())


def _match_statistics(
    left: pd.DataFrame,
    right: pd.DataFrame,
    keys: list[str],
) -> dict[str, int]:
    left_values = _key_values(left, keys)
    right_values = _key_values(right, keys)
    common = left_values & right_values
    left_matches = left[keys].apply(tuple, axis=1).isin(common)
    right_matches = right[keys].apply(tuple, axis=1).isin(common)
    return {
        "matched_left_rows": int(left_matches.sum()),
        "unmatched_left_rows": int((~left_matches).sum()),
        "matched_right_rows": int(right_matches.sum()),
        "unmatched_right_rows": int((~right_matches).sum()),
    }


def _ensure_non_empty_result(result: pd.DataFrame) -> None:
    if result.empty:
        raise FileMergeValidationError("Merge result is empty")
    if len(result.columns) == 0:
        raise FileMergeValidationError("Merge result has no columns")


def _concat_vertical(
    left: pd.DataFrame,
    right: pd.DataFrame,
    configuration: FileMergeConfiguration,
) -> MergeResult:
    conflicts = _type_conflicts(left, right)
    if conflicts:
        columns = [conflict["column"] for conflict in conflicts]
        raise FileMergeValidationError(
            f"Incompatible column type conflict(s): {columns}"
        )

    if configuration.add_source_column:
        if (
            configuration.source_column_name in left.columns
            or configuration.source_column_name in right.columns
        ):
            raise FileMergeValidationError(
                f"Source column '{configuration.source_column_name}' already exists"
            )
        left = left.assign(**{
            configuration.source_column_name: (
                configuration.left_source_label or "left"
            )
        })
        right = right.assign(**{
            configuration.source_column_name: (
                configuration.right_source_label or "right"
            )
        })

    result = pd.concat([left, right], ignore_index=True, sort=False)
    _ensure_non_empty_result(result)
    return MergeResult(
        dataframe=result,
        warnings=[],
        type_conflicts=conflicts,
        statistics={
            "left_rows": len(left),
            "right_rows": len(right),
            "result_rows": len(result),
        },
    )


def _join_by_key(
    left: pd.DataFrame,
    right: pd.DataFrame,
    configuration: FileMergeConfiguration,
) -> MergeResult:
    keys = configuration.join_keys
    _validate_join_keys(left, right, keys)
    left_duplicates = _duplicate_key_rows(left, keys)
    right_duplicates = _duplicate_key_rows(right, keys)
    overlap = _key_values(left, keys) & _key_values(right, keys)
    if left_duplicates and right_duplicates and overlap:
        raise FileMergeValidationError(
            "Many-to-many join detected: join keys are duplicated in both datasets"
        )

    result = left.merge(
        right,
        how=configuration.join_type.value,
        on=keys,
        suffixes=("_left", "_right"),
    )
    _ensure_non_empty_result(result)
    baseline = max(len(left), len(right), 1)
    if len(result) > baseline * 10 or len(result) > (len(left) + len(right)) * 5:
        raise FileMergeValidationError(
            "Join result has an excessive row-count expansion"
        )

    warnings = []
    if left_duplicates:
        warnings.append(
            f"Left dataset has {left_duplicates} row(s) with duplicated join keys."
        )
    if right_duplicates:
        warnings.append(
            f"Right dataset has {right_duplicates} row(s) with duplicated join keys."
        )
    stats = _match_statistics(left, right, keys)
    stats.update({
        "left_rows": len(left),
        "right_rows": len(right),
        "result_rows": len(result),
        "left_duplicate_keys": left_duplicates,
        "right_duplicate_keys": right_duplicates,
    })
    return MergeResult(
        dataframe=result,
        warnings=warnings,
        type_conflicts=[],
        statistics=stats,
    )


def _upsert(
    left: pd.DataFrame,
    right: pd.DataFrame,
    configuration: FileMergeConfiguration,
) -> MergeResult:
    keys = configuration.join_keys
    _validate_join_keys(left, right, keys)
    left_duplicates = _duplicate_key_rows(left, keys)
    right_duplicates = _duplicate_key_rows(right, keys)
    if left_duplicates or right_duplicates:
        raise FileMergeValidationError(
            "UPSERT requires unique keys in both datasets"
        )

    shared_non_key_columns = sorted(
        (set(left.columns) & set(right.columns)) - set(keys)
    )
    conflicts = _type_conflicts(left, right, shared_non_key_columns)
    if conflicts:
        columns = [conflict["column"] for conflict in conflicts]
        raise FileMergeValidationError(
            f"Incompatible column type conflict(s): {columns}"
        )

    all_columns = list(left.columns) + [
        column for column in right.columns if column not in left.columns
    ]
    result = left.reindex(columns=all_columns).reset_index(drop=True).copy()
    right_aligned = right.reindex(columns=all_columns)
    left_positions = {
        key: index
        for index, key in enumerate(
            result[keys].itertuples(index=False, name=None)
        )
    }
    updated_rows = 0
    inserted_rows = 0

    for _, right_row in right_aligned.iterrows():
        key = tuple(right_row[column] for column in keys)
        if key not in left_positions:
            result.loc[len(result)] = right_row
            inserted_rows += 1
            continue

        updated_rows += 1
        position = left_positions[key]
        for column in all_columns:
            if column in keys or column not in right.columns:
                continue
            right_value = right_row[column]
            left_value = result.at[position, column]
            if configuration.right_precedence:
                if not configuration.update_non_null_only or pd.notna(right_value):
                    result.at[position, column] = right_value
            elif pd.isna(left_value) and pd.notna(right_value):
                result.at[position, column] = right_value

    result = result.reset_index(drop=True)
    _ensure_non_empty_result(result)
    return MergeResult(
        dataframe=result,
        warnings=[],
        type_conflicts=conflicts,
        statistics={
            "left_rows": len(left),
            "right_rows": len(right),
            "result_rows": len(result),
            "updated_rows": updated_rows,
            "inserted_rows": inserted_rows,
            "left_duplicate_keys": left_duplicates,
            "right_duplicate_keys": right_duplicates,
        },
    )


def merge_dataframes(
    left: pd.DataFrame,
    right: pd.DataFrame,
    configuration: FileMergeConfiguration,
) -> MergeResult:
    validate_source_dataframe(left, "Left")
    validate_source_dataframe(right, "Right")
    mapped_right = _apply_column_mapping(right, configuration.column_mapping)

    if configuration.operation == MergeOperation.CONCAT_VERTICAL:
        return _concat_vertical(left.copy(), mapped_right, configuration)
    if configuration.operation == MergeOperation.JOIN_BY_KEY:
        return _join_by_key(left.copy(), mapped_right, configuration)
    if configuration.operation == MergeOperation.UPSERT:
        return _upsert(left.copy(), mapped_right, configuration)
    raise FileMergeValidationError(
        f"Unsupported merge operation: {configuration.operation}"
    )
