import polars as pl
import math
import numpy as np


# ─── Utilitaires ────────────────────────────────────────────

def safe_preview(df: pl.DataFrame) -> list:
    return df.head(5).to_dicts()


def marge_erreur(n: int) -> float:
    if n <= 0:
        return 0.0
    return round(1.96 * math.sqrt(0.25 / n), 4)


# ─── Stratifié ──────────────────────────────────────────────

def stratified_sample(
    df: pl.DataFrame,
    strate_col: str,
    n: int = None,
    mode: str = "proportionnel"
) -> dict:
    if strate_col not in df.columns:
        return {"error": f"Colonne introuvable : {strate_col}"}

    total = df.height
    modalites = df[strate_col].unique().to_list()
    frames = []

    for modalite in modalites:
        groupe = df.filter(pl.col(strate_col) == modalite)

        if mode == "proportionnel":
            taille = max(1, round(len(groupe) / total * n)) if n else len(groupe)
        else:  # equilibre
            taille = max(1, n // len(modalites)) if n else len(groupe)

        taille = min(taille, len(groupe))
        frames.append(groupe.sample(n=taille, seed=42))

    result = pl.concat(frames)

    return {
        "method": "stratifié",
        "strate_col": strate_col,
        "mode": mode,
        "modalites": len(modalites),
        "rows_original": total,
        "rows_sampled": result.height,
        "marge_erreur": marge_erreur(result.height),
        "niveau_confiance": "95%",
        "preview": safe_preview(result),
        "df": result
    }


def bootstrap_sample(df: pl.DataFrame, n: int) -> dict:
    if n <= 0:
        return {"error": "n doit être supérieur à 0"}

    total = df.height
    indices = np.random.choice(total, size=n, replace=True)
    result = df[indices.tolist()]

    return {
        "method": "bootstrap",
        "rows_original": total,
        "rows_sampled": result.height,
        "marge_erreur": marge_erreur(result.height),
        "niveau_confiance": "95%",
        "preview": safe_preview(result),
        "df": result
    }
