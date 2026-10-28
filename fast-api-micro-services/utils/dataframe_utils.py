from typing import Any
import pandas as pd
from services.file_parser_service import clean_dataframe_for_json
from storage.dataset_store import save_dataset, get_dataset


def records_from_dataframe(df: pd.DataFrame) -> list[dict[str, Any]]:
    cleaned_df = clean_dataframe_for_json(df.copy())
    return cleaned_df.to_dict(orient="records")


def persist_transformation_result(
    file_id: str,
    df: pd.DataFrame,
) -> dict[str, Any]:

    save_dataset(file_id, df, stage="preview")

    return {
        "output": "preview.csv",
        "has_preview": True
    }