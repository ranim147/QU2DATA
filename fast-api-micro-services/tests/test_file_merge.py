import unittest
from unittest.mock import patch

import pandas as pd
from fastapi import HTTPException
from pydantic import ValidationError

from routers.file_merge_routes import (
    execute_file_merge,
    preview_file_merge,
)
from schemas.file_merge_schema import FileMergeConfiguration
from services.file_merge_service import (
    FileMergeValidationError,
    merge_dataframes,
    recommend_merge,
)


def configuration(operation: str, **overrides) -> FileMergeConfiguration:
    values = {
        "left_file_id": "left-id",
        "right_file_id": "right-id",
        "operation": operation,
        "add_source_column": False,
    }
    values.update(overrides)
    return FileMergeConfiguration(**values)


class FileMergeServiceTests(unittest.TestCase):
    def test_recommendation_contains_scores_and_key_evidence(self):
        left = pd.DataFrame({"id": [1, 2], "name": ["a", "b"]})
        right = pd.DataFrame({"id": [2, 3], "name": ["b", "c"]})

        result = recommend_merge(left, right)

        self.assertIn(
            result["recommended_operation"],
            {"CONCAT_VERTICAL", "JOIN_BY_KEY", "UPSERT", "MANUAL_REVIEW"},
        )
        self.assertEqual(
            set(result["operation_scores"]),
            {"CONCAT_VERTICAL", "JOIN_BY_KEY", "UPSERT", "MANUAL_REVIEW"},
        )
        self.assertTrue(result["candidate_keys"])
        self.assertEqual(result["left_shape"], {"rows": 2, "columns": 2})

    def test_concat_with_identical_columns(self):
        left = pd.DataFrame({"id": [1], "name": ["left"]})
        right = pd.DataFrame({"id": [2], "name": ["right"]})

        result = merge_dataframes(
            left,
            right,
            configuration("CONCAT_VERTICAL"),
        )

        self.assertEqual(result.dataframe.to_dict("records"), [
            {"id": 1, "name": "left"},
            {"id": 2, "name": "right"},
        ])

    def test_concat_aligns_columns_in_different_order(self):
        left = pd.DataFrame({"id": [1], "name": ["left"]})
        right = pd.DataFrame({"name": ["right"], "id": [2]})

        result = merge_dataframes(
            left,
            right,
            configuration("CONCAT_VERTICAL"),
        )

        self.assertEqual(list(result.dataframe.columns), ["id", "name"])
        self.assertEqual(result.dataframe.iloc[1].to_dict(), {
            "id": 2,
            "name": "right",
        })

    def test_concat_supports_missing_columns(self):
        left = pd.DataFrame({"id": [1], "left_value": ["a"]})
        right = pd.DataFrame({"id": [2], "right_value": ["b"]})

        result = merge_dataframes(
            left,
            right,
            configuration("CONCAT_VERTICAL"),
        )

        self.assertEqual(
            list(result.dataframe.columns),
            ["id", "left_value", "right_value"],
        )
        self.assertTrue(pd.isna(result.dataframe.loc[0, "right_value"]))
        self.assertTrue(pd.isna(result.dataframe.loc[1, "left_value"]))

    def test_concat_applies_right_column_mapping(self):
        left = pd.DataFrame({"id": [1], "name": ["left"]})
        right = pd.DataFrame({"id": [2], "full_name": ["right"]})

        result = merge_dataframes(
            left,
            right,
            configuration(
                "CONCAT_VERTICAL",
                column_mapping={"full_name": "name"},
            ),
        )

        self.assertEqual(list(result.dataframe.columns), ["id", "name"])
        self.assertEqual(result.dataframe.loc[1, "name"], "right")

    def test_concat_uses_readable_source_labels(self):
        left = pd.DataFrame({"id": [1]})
        right = pd.DataFrame({"id": [2]})

        result = merge_dataframes(
            left,
            right,
            configuration(
                "CONCAT_VERTICAL",
                add_source_column=True,
                left_source_label="left-customers.csv",
                right_source_label="right-customers.csv",
            ),
        )

        self.assertEqual(
            result.dataframe["_source_file"].tolist(),
            ["left-customers.csv", "right-customers.csv"],
        )

    def test_concat_uses_safe_source_label_fallbacks(self):
        left = pd.DataFrame({"id": [1]})
        right = pd.DataFrame({"id": [2]})

        result = merge_dataframes(
            left,
            right,
            configuration("CONCAT_VERTICAL", add_source_column=True),
        )

        self.assertEqual(
            result.dataframe["_source_file"].tolist(),
            ["left", "right"],
        )

    def test_concat_rejects_incompatible_types(self):
        left = pd.DataFrame({"id": [1], "value": [10]})
        right = pd.DataFrame({"id": [2], "value": ["ten"]})

        with self.assertRaisesRegex(
            FileMergeValidationError,
            "type conflict",
        ):
            merge_dataframes(
                left,
                right,
                configuration("CONCAT_VERTICAL"),
            )

    def test_inner_join(self):
        left = pd.DataFrame({"id": [1, 2], "left": ["a", "b"]})
        right = pd.DataFrame({"id": [2, 3], "right": ["x", "y"]})

        result = merge_dataframes(
            left,
            right,
            configuration(
                "JOIN_BY_KEY",
                join_keys=["id"],
                join_type="inner",
            ),
        )

        self.assertEqual(result.dataframe["id"].tolist(), [2])
        self.assertEqual(result.statistics["matched_left_rows"], 1)

    def test_left_join(self):
        left = pd.DataFrame({"id": [1, 2], "left": ["a", "b"]})
        right = pd.DataFrame({"id": [2], "right": ["x"]})

        result = merge_dataframes(
            left,
            right,
            configuration("JOIN_BY_KEY", join_keys=["id"]),
        )

        self.assertEqual(result.dataframe["id"].tolist(), [1, 2])
        self.assertTrue(pd.isna(result.dataframe.loc[0, "right"]))

    def test_outer_join(self):
        left = pd.DataFrame({"id": [1], "left": ["a"]})
        right = pd.DataFrame({"id": [2], "right": ["x"]})

        result = merge_dataframes(
            left,
            right,
            configuration(
                "JOIN_BY_KEY",
                join_keys=["id"],
                join_type="outer",
            ),
        )

        self.assertEqual(set(result.dataframe["id"]), {1, 2})

    def test_composite_join_key(self):
        left = pd.DataFrame({
            "country": ["TN", "TN"],
            "id": [1, 2],
            "left": ["a", "b"],
        })
        right = pd.DataFrame({
            "country": ["TN", "FR"],
            "id": [2, 2],
            "right": ["x", "y"],
        })

        result = merge_dataframes(
            left,
            right,
            configuration(
                "JOIN_BY_KEY",
                join_keys=["country", "id"],
                join_type="inner",
            ),
        )

        self.assertEqual(len(result.dataframe), 1)
        self.assertEqual(result.dataframe.loc[0, "right"], "x")

    def test_one_sided_duplicate_keys_are_reported(self):
        left = pd.DataFrame({"id": [1, 1], "left": ["a", "b"]})
        right = pd.DataFrame({"id": [1], "right": ["x"]})

        result = merge_dataframes(
            left,
            right,
            configuration("JOIN_BY_KEY", join_keys=["id"]),
        )

        self.assertEqual(result.statistics["left_duplicate_keys"], 2)
        self.assertTrue(result.warnings)

    def test_many_to_many_join_is_rejected(self):
        left = pd.DataFrame({"id": [1, 1], "left": ["a", "b"]})
        right = pd.DataFrame({"id": [1, 1], "right": ["x", "y"]})

        with self.assertRaisesRegex(
            FileMergeValidationError,
            "Many-to-many",
        ):
            merge_dataframes(
                left,
                right,
                configuration("JOIN_BY_KEY", join_keys=["id"]),
            )

    def test_upsert_updates_existing_rows(self):
        left = pd.DataFrame({"id": [1, 2], "value": ["old", "keep"]})
        right = pd.DataFrame({"id": [1], "value": ["new"]})

        result = merge_dataframes(
            left,
            right,
            configuration("UPSERT", join_keys=["id"]),
        )

        self.assertEqual(result.dataframe.loc[0, "value"], "new")
        self.assertEqual(result.statistics["updated_rows"], 1)

    def test_upsert_inserts_new_rows(self):
        left = pd.DataFrame({"id": [1], "value": ["old"]})
        right = pd.DataFrame({"id": [2], "value": ["new"]})

        result = merge_dataframes(
            left,
            right,
            configuration("UPSERT", join_keys=["id"]),
        )

        self.assertEqual(result.dataframe["id"].tolist(), [1, 2])
        self.assertEqual(result.statistics["inserted_rows"], 1)

    def test_empty_dataset_is_rejected(self):
        left = pd.DataFrame(columns=["id"])
        right = pd.DataFrame({"id": [1]})

        with self.assertRaisesRegex(
            FileMergeValidationError,
            "dataset is empty",
        ):
            merge_dataframes(
                left,
                right,
                configuration("CONCAT_VERTICAL"),
            )

    def test_dataset_without_columns_is_rejected(self):
        left = pd.DataFrame(index=[0])
        right = pd.DataFrame({"id": [1]})

        with self.assertRaisesRegex(
            FileMergeValidationError,
            "has no columns",
        ):
            merge_dataframes(
                left,
                right,
                configuration("CONCAT_VERTICAL"),
            )

    def test_invalid_mapping_is_rejected(self):
        left = pd.DataFrame({"id": [1]})
        right = pd.DataFrame({"id": [2]})

        with self.assertRaisesRegex(
            FileMergeValidationError,
            "unknown right column",
        ):
            merge_dataframes(
                left,
                right,
                configuration(
                    "CONCAT_VERTICAL",
                    column_mapping={"missing": "id"},
                ),
            )

    def test_empty_join_result_is_rejected(self):
        left = pd.DataFrame({"id": [1]})
        right = pd.DataFrame({"id": [2]})

        with self.assertRaisesRegex(
            FileMergeValidationError,
            "result is empty",
        ):
            merge_dataframes(
                left,
                right,
                configuration(
                    "JOIN_BY_KEY",
                    join_keys=["id"],
                    join_type="inner",
                ),
            )

    def test_invalid_configuration_is_rejected(self):
        with self.assertRaises(ValidationError):
            configuration("JOIN_BY_KEY", join_keys=[], preview_limit=0)

    def test_identical_ids_are_rejected(self):
        with self.assertRaisesRegex(ValidationError, "must be different"):
            FileMergeConfiguration(
                left_file_id="same-id",
                right_file_id="same-id",
                operation="CONCAT_VERTICAL",
            )

    def test_invalid_join_type_is_rejected(self):
        with self.assertRaises(ValidationError):
            configuration(
                "JOIN_BY_KEY",
                join_keys=["id"],
                join_type="cross",
            )


class FileMergeRouterTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_file_returns_not_found(self):
        request = configuration("CONCAT_VERTICAL")

        with patch(
            "routers.file_merge_routes.get_dataset",
            side_effect=HTTPException(status_code=404, detail="not found"),
        ):
            with self.assertRaises(HTTPException) as context:
                await preview_file_merge(request)

        self.assertEqual(context.exception.status_code, 404)

    async def test_preview_does_not_modify_sources(self):
        sources = {
            "left-id": pd.DataFrame({"id": [1]}),
            "right-id": pd.DataFrame({"id": [2]}),
        }
        originals = {
            key: value.copy(deep=True)
            for key, value in sources.items()
        }

        with (
            patch(
                "routers.file_merge_routes.get_dataset",
                side_effect=lambda dataset_id, stage: sources[dataset_id].copy(),
            ),
            patch("routers.file_merge_routes.init_dataset") as init_dataset,
        ):
            response = await preview_file_merge(
                configuration("CONCAT_VERTICAL")
            )

        self.assertTrue(response.success)
        init_dataset.assert_not_called()
        for dataset_id, dataframe in originals.items():
            pd.testing.assert_frame_equal(sources[dataset_id], dataframe)

    async def test_execute_creates_new_dataset_without_modifying_sources(self):
        sources = {
            "left-id": pd.DataFrame({"id": [1]}),
            "right-id": pd.DataFrame({"id": [2]}),
        }
        originals = {
            key: value.copy(deep=True)
            for key, value in sources.items()
        }
        created = {}

        def capture_dataset(dataset_id, dataframe):
            created[dataset_id] = {
                "original": dataframe.copy(deep=True),
                "current": dataframe.copy(deep=True),
            }

        with (
            patch(
                "routers.file_merge_routes.get_dataset",
                side_effect=lambda dataset_id, stage: sources[dataset_id].copy(),
            ),
            patch(
                "routers.file_merge_routes.init_dataset",
                side_effect=capture_dataset,
            ),
            patch(
                "routers.file_merge_routes.uuid.uuid4",
                return_value="new-dataset-id",
            ),
        ):
            response = await execute_file_merge(
                configuration(
                    "CONCAT_VERTICAL",
                    add_source_column=True,
                    left_source_label="left.csv",
                    right_source_label="right.csv",
                )
            )

        self.assertTrue(response.success)
        self.assertEqual(response.data.dataset_id, "new-dataset-id")
        self.assertEqual(
            response.data.created_objects,
            ["original.csv", "current.csv"],
        )
        self.assertIn("new-dataset-id", created)
        self.assertEqual(
            created["new-dataset-id"]["current"]["_source_file"].tolist(),
            ["left.csv", "right.csv"],
        )
        pd.testing.assert_frame_equal(
            created["new-dataset-id"]["original"],
            created["new-dataset-id"]["current"],
        )
        for dataset_id, dataframe in originals.items():
            pd.testing.assert_frame_equal(sources[dataset_id], dataframe)


if __name__ == "__main__":
    unittest.main()
