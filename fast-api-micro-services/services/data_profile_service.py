import pandas as pd

from schemas.preprocessing_schema import ColumnProfile


def is_identifier_column(column_name: str) -> bool:
    lowered = column_name.lower()
    return lowered in ["id", "user_id", "patient_id"] or lowered.endswith("_id")


def profile_dataframe(df: pd.DataFrame) -> list[ColumnProfile]:
    rows = len(df)
    profiles = []

    for column in df.columns:
        missing_count = int(df[column].isnull().sum())
        missing_percentage = (
            round((missing_count / rows) * 100, 2)
            if rows > 0
            else 0
        )
        dtype = str(df[column].dtype)

        if is_identifier_column(column):
            allowed_methods = []
            recommended = False
            reason = "Identifier column"
        elif missing_count == 0:
            allowed_methods = (
                ["mean", "median", "knn"]
                if pd.api.types.is_numeric_dtype(df[column])
                else ["mode"]
            )
            recommended = False
            reason = "No missing values"
        elif pd.api.types.is_numeric_dtype(df[column]):
            allowed_methods = ["mean", "median", "knn"]
            recommended = True
            reason = "Numeric column with missing values"
        else:
            allowed_methods = ["mode"]
            recommended = True
            reason = "Categorical column with missing values"

        profiles.append(
            ColumnProfile(
                name=column,
                dtype=dtype,
                missing_count=missing_count,
                missing_percentage=missing_percentage,
                allowed_methods=allowed_methods,
                recommended=recommended,
                reason=reason
            )
        )

    return profiles
