import polars as pl
import numpy as np
from scipy import stats


# ─────────────────────────────────────────
# 1. DÉTECTION D'ÉLIGIBILITÉ + STATS (1 colonne)
# ─────────────────────────────────────────
def detect_log_transform(series: pl.Series, method: str = "log1p") -> dict:
    s = series.drop_nulls().cast(pl.Float64)

    if len(s) == 0:
        return {
            "method": method,
            "eligible": False,
            "reason": "Colonne vide"
        }

    min_val = float(s.min())
    arr = s.to_numpy()
    skew_before = float(stats.skew(arr)) if len(arr) > 2 else None

    eligible = True
    reason = "OK"

    if method == "log1p" and min_val < -1:
        eligible = False
        reason = "Contient des valeurs < -1, log1p impossible (résultat négatif)"
    elif method == "log" and min_val <= 0:
        eligible = False
        reason = "Contient des valeurs <= 0, log impossible"
    elif method not in ("log1p", "log"):
        eligible = False
        reason = "Méthode inconnue"

    skew_after = None
    if eligible:
        transformed = np.log1p(arr) if method == "log1p" else np.log(arr)
        skew_after = float(stats.skew(transformed)) if len(transformed) > 2 else None

    return {
        "method": method,
        "eligible": eligible,
        "reason": reason,
        "min": round(min_val, 2),
        "skewness_before": round(skew_before, 2) if skew_before is not None else None,
        "skewness_after": round(skew_after, 2) if skew_after is not None else None
    }


# ─────────────────────────────────────────
# 2. DÉTECTION SUR PLUSIEURS COLONNES
# ─────────────────────────────────────────
def detect_log_transform_dataframe(df: pl.DataFrame,
                                    columns: list,
                                    method: str = "log1p") -> dict:
    results = {}
    for col in columns:
        results[col] = detect_log_transform(df[col], method=method)
    return results


# ─────────────────────────────────────────
# 3. APPLICATION DE LA TRANSFORMATION
# ─────────────────────────────────────────
def apply_log_transform(df: pl.DataFrame, column: str,
                         method: str = "log1p",
                         action: str = "replace") -> pl.DataFrame:

    check = detect_log_transform(df[column], method=method)
    if not check["eligible"]:
        raise ValueError(check["reason"])

    series = df[column].cast(pl.Float64)
    transformed = series.log1p() if method == "log1p" else series.log()

    if action == "replace":
        df = df.with_columns(transformed.alias(column))

    elif action == "new_column":
        df = df.with_columns(transformed.alias(f"{column}_log"))

    elif action == "ignore":
        pass

    else:
        raise ValueError(f"Action inconnue : {action}")

    return df


# ─────────────────────────────────────────
# 4. HELPER — nettoie NaN pour JSON
# ─────────────────────────────────────────
def clean_for_json(obj):
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj