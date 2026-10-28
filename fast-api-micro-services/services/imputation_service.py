from typing import Optional, Literal

import numpy as np
import pandas as pd
from fastapi import HTTPException
from sklearn.impute import SimpleImputer, KNNImputer


ImputationMethod = Literal["mean", "median", "mode", "knn"]


def apply_imputation(
    df: pd.DataFrame,
    method: ImputationMethod,
    columns: Optional[list[str]] = None,
    n_neighbors: int = 5
) -> tuple[pd.DataFrame, list[str]]:
    selected_columns = columns if columns else list(df.columns)

    unknown_columns = [col for col in selected_columns if col not in df.columns]
    if unknown_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown columns: {unknown_columns}"
        )

    imputed_columns = []

    if method in ["mean", "median"]:
        numeric_columns = (
            df[selected_columns]
            .select_dtypes(include=[np.number])
            .columns
            .tolist()
        )

        if not numeric_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Method '{method}' requires numeric columns"
            )

        imputer = SimpleImputer(strategy=method)
        df[numeric_columns] = imputer.fit_transform(df[numeric_columns])
        imputed_columns = numeric_columns

    elif method == "mode":
        imputer = SimpleImputer(strategy="most_frequent")
        df[selected_columns] = imputer.fit_transform(df[selected_columns])
        imputed_columns = selected_columns

    elif method == "knn":
        numeric_columns = (
            df[selected_columns]
            .select_dtypes(include=[np.number])
            .columns
            .tolist()
        )

        if not numeric_columns:
            raise HTTPException(
                status_code=400,
                detail="KNN imputation requires numeric columns"
            )

        imputer = KNNImputer(n_neighbors=n_neighbors)
        df[numeric_columns] = imputer.fit_transform(df[numeric_columns])
        imputed_columns = numeric_columns

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid imputation method"
        )

    return df, imputed_columns