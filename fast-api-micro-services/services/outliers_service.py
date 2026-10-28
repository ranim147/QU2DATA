import pandas as pd
import numpy as np
from scipy import stats


# ─────────────────────────────────────────
# 2. ANALYSE DES COLONNES
# ─────────────────────────────────────────
def analyze_columns(df: pd.DataFrame) -> dict:
    report = {}
    for col in df.columns:
        col_lower = col.lower()
        dtype = df[col].dtype

        # Identifiants
        if any(k in col_lower for k in ["id", "code", "zip", "postal", "phone"]):
            report[col] = {
                "type": "identifier",
                "analysable": False,
                "reason": "Colonne identifiant"
            }

        # Dates
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            report[col] = {
                "type": "date",
                "analysable": False,
                "reason": "Colonne date"
            }

        # Texte / catégorie
        elif pd.api.types.is_string_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
            report[col] = {
                "type": "categorical",
                "analysable": False,
                "reason": "Colonne texte/catégorie"
            }

        # Numérique
        elif pd.api.types.is_numeric_dtype(df[col]):
            n_unique = df[col].nunique(dropna=True)
            unique_ratio = n_unique / len(df)

            if unique_ratio < 0.02 and n_unique < 10:
                report[col] = {
                    "type": "categorical_encoded",
                    "analysable": False,
                    "reason": f"{n_unique} valeurs uniques, probablement une catégorie"
                }
            else:
                series = df[col].dropna()
                report[col] = {
                    "type": "numeric",
                    "analysable": True,
                    "min": round(float(series.min()), 2),
                    "max": round(float(series.max()), 2),
                    "mean": round(float(series.mean()), 2),
                    "std": round(float(series.std()), 2),
                    "null_count": int(df[col].isnull().sum())
                }
        else:
            report[col] = {
                "type": "unknown",
                "analysable": False,
                "reason": "Type non reconnu"
            }
    return report


# ─────────────────────────────────────────
# 3. IQR
# ─────────────────────────────────────────
def detect_outliers_iqr(series: pd.Series, factor: float = 1.5) -> dict:
    s = pd.to_numeric(series, errors="coerce").dropna().astype(float)
    Q1 = float(s.quantile(0.25))
    Q3 = float(s.quantile(0.75))
    IQR = Q3 - Q1

    lower_bound = Q1 - factor * IQR
    upper_bound = Q3 + factor * IQR

    outlier_mask = (s < lower_bound) | (s > upper_bound)
    outlier_values = s.loc[outlier_mask].tolist()
    outlier_indices = s.index[outlier_mask].astype(int).tolist()

    return {
        "method": "iqr",
        "factor": factor,
        "Q1": round(Q1, 2),
        "Q3": round(Q3, 2),
        "IQR": round(IQR, 2),
        "lower_bound": round(lower_bound, 2),
        "upper_bound": round(upper_bound, 2),
        "outlier_count": len(outlier_indices),
        "outlier_indices": outlier_indices,
        "outlier_values": outlier_values[:20]
    }


# ─────────────────────────────────────────
# 4. Z-SCORE
# ─────────────────────────────────────────
def detect_outliers_zscore(series: pd.Series, threshold: float = 3.0) -> dict:
    s = pd.to_numeric(series, errors="coerce").dropna().astype(float)
    mean = float(s.mean())
    std = float(s.std())

    z_scores = ((s - mean) / std).abs()
    outlier_mask = z_scores > threshold
    outlier_values = s.loc[outlier_mask].tolist()
    outlier_indices = s.index[outlier_mask].astype(int).tolist()

    return {
        "method": "zscore",
        "mean": round(mean, 2),
        "std": round(std, 2),
        "threshold": threshold,
        "outlier_count": len(outlier_indices),
        "outlier_indices": outlier_indices,
        "outlier_values": outlier_values[:20]
    }


# ─────────────────────────────────────────
# 5. GRUBBS
# ─────────────────────────────────────────
def detect_outliers_grubbs(series: pd.Series, alpha: float = 0.05) -> dict:
    outlier_indices = []
    outlier_values = []

    # Convertit en numpy pour les calculs itératifs
    s = pd.to_numeric(series, errors="coerce").dropna().astype(float)
    arr = s.to_numpy().copy()
    remaining_indices = s.index.astype(int).tolist()
    remaining = arr.copy()

    max_iterations = len(arr) // 10

    for _ in range(max_iterations):
        n = len(remaining)
        if n < 3:
            break

        mean = np.mean(remaining)
        std = np.std(remaining, ddof=1)
        if std == 0:
            break

        abs_dev = np.abs(remaining - mean)
        G_stat = abs_dev.max() / std
        max_pos = abs_dev.argmax()

        t_crit = stats.t.ppf(1 - alpha / (2 * n), df=n - 2)
        G_crit = ((n - 1) / np.sqrt(n)) * np.sqrt(
            t_crit**2 / (n - 2 + t_crit**2)
        )

        if G_stat > G_crit:
            outlier_indices.append(remaining_indices[max_pos])
            outlier_values.append(float(remaining[max_pos]))
            remaining = np.delete(remaining, max_pos)
            remaining_indices.pop(max_pos)
        else:
            break

    return {
        "method": "grubbs",
        "alpha": alpha,
        "outlier_count": len(outlier_indices),
        "outlier_indices": outlier_indices,
        "outlier_values": outlier_values[:20]
    }


# ─────────────────────────────────────────
# 6. DISPATCHER
# ─────────────────────────────────────────
def detect_outliers(series: pd.Series, method: str = "iqr", **kwargs) -> dict:
    if method == "iqr":
        return detect_outliers_iqr(series, **kwargs)
    elif method == "zscore":
        return detect_outliers_zscore(series, **kwargs)
    elif method == "grubbs":
        return detect_outliers_grubbs(series, **kwargs)
    else:
        raise ValueError(f"Méthode inconnue : {method}")


# ─────────────────────────────────────────
# 7. DÉTECTION SUR PLUSIEURS COLONNES
# ─────────────────────────────────────────
def detect_outliers_dataframe(df: pd.DataFrame,
                               columns: list,
                               method: str = "iqr",
                               **kwargs) -> dict:
    results = {}
    for col in columns:
        results[col] = detect_outliers(df[col], method=method, **kwargs)
    return results


# ─────────────────────────────────────────
# 8. ACTIONS
# ─────────────────────────────────────────
def apply_action(df:pd.DataFrame, column: str,
                 outlier_indices: list, action: str) -> pd.DataFrame:
    result = df.copy()

    if action == "delete":
        result = result.drop(index=outlier_indices, errors="ignore").reset_index(drop=True)

    elif action == "replace_median":
        median = pd.to_numeric(result[column], errors="coerce").median()
        result.loc[outlier_indices, column] = median

    elif action == "replace_mean":
        mean = round(float(pd.to_numeric(result[column], errors="coerce").mean()), 2)
        result.loc[outlier_indices, column] = mean

    elif action == "mark":
        result[f"{column}_is_outlier"] = [
            1 if i in outlier_indices else 0 for i in range(len(result))
        ]

    elif action == "ignore":
        pass

    return result


# ─────────────────────────────────────────
# 9. HELPER — nettoie NaN pour JSON
# ─────────────────────────────────────────
def clean_for_json(obj):
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj
