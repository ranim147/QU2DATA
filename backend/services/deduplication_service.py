import polars as pl
import httpx
import json
import os

MISTRAL_MODEL = "mistral-small-latest"


# ─────────────────────────────────────────
# 1. RECOMMANDATION DES COLONNES — via LLM
# ─────────────────────────────────────────
async def recommend_dedup_columns(df: pl.DataFrame) -> dict:
    # Lecture de la clé au moment de l'appel (pas à l'import)
    api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    if not api_key:
        return {"error": "Clé MISTRAL_API_KEY manquante dans le .env"}

    total_rows = df.shape[0]

    column_profiles = []
    for col in df.columns:
        series = df[col]
        n_unique   = series.n_unique()
        null_count = series.null_count()
        dtype      = str(series.dtype)
        dup_rate   = round((1 - n_unique / total_rows) * 100, 1) if total_rows > 0 else 0.0

        sample_values = (
            series.drop_nulls()
                  .head(5)
                  .cast(pl.String)
                  .to_list()
        )

        column_profiles.append({
            "name":               col,
            "type":               dtype,
            "total_rows":         total_rows,
            "unique_values":      n_unique,
            "duplicate_rate_pct": dup_rate,
            "null_count":         null_count,
            "sample_values":      sample_values
        })

    prompt = f"""
Tu es un expert en qualité de données.
On t'envoie le profil statistique des colonnes d'un fichier de données.
Pour chaque colonne, tu dois décider si supprimer les doublons est pertinent ou non.

Voici les profils des colonnes :
{json.dumps(column_profiles, ensure_ascii=False, indent=2)}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte autour) 
avec exactement cette structure :

{{
  "recommended": [
    {{
      "column": "nom_colonne",
      "duplicate_rate": 12.5,
      "reason": "explication courte et claire en français"
    }}
  ],
  "not_advised": [
    {{
      "column": "nom_colonne",
      "duplicate_rate": 80.0,
      "reason": "explication courte et claire en français"
    }}
  ],
  "low_duplicate": [
    {{
      "column": "nom_colonne",
      "duplicate_rate": 0.2,
      "reason": "explication courte et claire en français"
    }}
  ]
}}

Règles de décision que tu dois appliquer intelligemment :
- "recommended"   : colonnes où un doublon est probablement une erreur (email, id unique, numéro de commande, etc.)
- "not_advised"   : colonnes où les doublons sont normaux et attendus (code produit, catégorie, région, statut, etc.)
- "low_duplicate" : colonnes avec moins de 1% de doublons, rien à faire

Utilise le nom de colonne, le type, le taux de doublon ET les exemples de valeurs
pour raisonner — ne te base pas uniquement sur le nom.
"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type":  "application/json"
                },
                json={
                    "model":       MISTRAL_MODEL,
                    "messages":    [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens":  2000
                }
            )
            response.raise_for_status()
            raw = response.json()["choices"][0]["message"]["content"].strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw)

    except httpx.HTTPStatusError as e:
        return {"error": f"Erreur API Mistral ({e.response.status_code}) : {e.response.text}"}
    except json.JSONDecodeError as e:
        return {"error": f"Réponse LLM non parsable : {str(e)}", "raw": raw}
    except Exception as e:
        return {"error": f"Erreur inattendue : {str(e)}"}


# ─────────────────────────────────────────
# 2. ANALYSE DES DOUBLONS
# ─────────────────────────────────────────
def analyze_duplicates(df: pl.DataFrame, subset: list = None) -> dict:
    total_rows = df.shape[0]

    if subset:
        missing = [c for c in subset if c not in df.columns]
        if missing:
            return {"error": f"Colonnes introuvables : {missing}"}
        df_check = df.select(subset)
    else:
        df_check = df

    is_duplicate    = df_check.is_duplicated()
    duplicate_count = int(is_duplicate.sum())
    duplicate_idx   = [i for i, v in enumerate(is_duplicate.to_list()) if v]

    duplicate_preview = []
    if duplicate_idx:
        for row in df[duplicate_idx[:10]].to_dicts():
            duplicate_preview.append({
                k: (None if isinstance(v, float) and v != v else v)
                for k, v in row.items()
            })

    return {
        "total_rows":        total_rows,
        "duplicate_count":   duplicate_count,
        "unique_rows":       total_rows - duplicate_count,
        "duplicate_rate":    round(duplicate_count / total_rows * 100, 2) if total_rows > 0 else 0.0,
        "duplicate_preview": duplicate_preview,
        "subset_used":       subset if subset else "toutes les colonnes"
    }


# ─────────────────────────────────────────
# 3. SUPPRESSION DES DOUBLONS
# ─────────────────────────────────────────
def remove_duplicates(
    df: pl.DataFrame,
    subset: list = None,
    keep: str = "first"
) -> dict:
    if keep not in ("first", "last"):
        return {"error": "Le paramètre 'keep' doit être 'first' ou 'last'."}

    if subset:
        missing = [c for c in subset if c not in df.columns]
        if missing:
            return {"error": f"Colonnes introuvables : {missing}"}

    rows_before = df.shape[0]

    if keep == "last":
        df = df.reverse()

    df_clean = df.unique(subset=subset, keep="first", maintain_order=True)

    if keep == "last":
        df_clean = df_clean.reverse()

    rows_after   = df_clean.shape[0]
    rows_removed = rows_before - rows_after

    return {
        "df":          df_clean,
        "rows_before": rows_before,
        "rows_after":  rows_after,
        "rows_removed": rows_removed,
        "keep":        keep,
        "subset_used": subset if subset else "toutes les colonnes",
        "message": (
            f"{rows_removed} doublon(s) supprimé(s) sur {rows_before} lignes. "
            f"Il reste {rows_after} lignes uniques."
        )
    }


# ─────────────────────────────────────────
# 4. HELPER — aperçu sans NaN
# ─────────────────────────────────────────
def safe_preview(df: pl.DataFrame, n: int = 5) -> list:
    result = []
    for row in df.head(n).to_dicts():
        result.append({
            k: (None if isinstance(v, float) and v != v else v)
            for k, v in row.items()
        })
    return result