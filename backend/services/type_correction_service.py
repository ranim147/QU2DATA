import polars as pl
import httpx
import json
import os

MISTRAL_MODEL = "mistral-small-latest"

SUPPORTED_TYPES = ["Int64", "Float64", "String", "Boolean", "Date", "Datetime"]


# ─────────────────────────────────────────
# 1. ANALYSE LLM — mode auto
# ─────────────────────────────────────────
async def recommend_type_corrections(df: pl.DataFrame) -> dict:
    api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    if not api_key:
        return {"error": "Clé MISTRAL_API_KEY manquante dans le .env"}

    total_rows = df.shape[0]
    column_profiles = []

    for col in df.columns:
        series = df[col]
        sample_values = (
            series.drop_nulls().head(8).cast(pl.String).to_list()
        )
        column_profiles.append({
            "name":          col,
            "current_type":  str(series.dtype),
            "total_rows":    total_rows,
            "null_count":    series.null_count(),
            "sample_values": sample_values
        })

    prompt = f"""
Tu es un expert en qualité de données.
Voici le profil des colonnes d'un fichier de données avec leur type actuel détecté automatiquement.
Pour chaque colonne, dis si le type est correct ou s'il faut le corriger.

Profils :
{json.dumps(column_profiles, ensure_ascii=False, indent=2)}

Réponds UNIQUEMENT avec un JSON valide (sans markdown) avec cette structure :

{{
  "correct": [
    {{
      "column": "nom_colonne",
      "current_type": "Int64",
      "reason": "explication courte en français"
    }}
  ],
  "to_correct": [
    {{
      "column": "nom_colonne",
      "current_type": "String",
      "suggested_type": "Date",
      "reason": "explication courte en français"
    }}
  ]
}}

Types disponibles pour suggested_type : Int64, Float64, String, Boolean, Date, Datetime

Corrections fréquentes :
- String avec valeurs "2024-01-15" → Date
- String avec valeurs "123" → Int64
- String avec valeurs "12.5" → Float64
- String avec valeurs "true/false" ou "oui/non" → Boolean
- Int64 avec seulement 0 et 1 → Boolean
- Float64 dont tous les exemples sont entiers → Int64

Raisonne sur les exemples de valeurs réels.
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

        result = json.loads(raw.strip())

        # Ajoute les types disponibles pour que le frontend puisse proposer
        # un sélecteur même sur les colonnes "correct"
        for item in result.get("correct", []):
            item["available_types"] = SUPPORTED_TYPES
        for item in result.get("to_correct", []):
            item["available_types"] = SUPPORTED_TYPES

        return result

    except httpx.HTTPStatusError as e:
        return {"error": f"Erreur API Mistral ({e.response.status_code}) : {e.response.text}"}
    except json.JSONDecodeError as e:
        return {"error": f"Réponse LLM non parsable : {str(e)}", "raw": raw}
    except Exception as e:
        return {"error": f"Erreur inattendue : {str(e)}"}


# ─────────────────────────────────────────
# 4. APPLIQUER LA CORRECTION
# ─────────────────────────────────────────
def apply_type_correction(
    df: pl.DataFrame,
    column: str,
    target_type: str
) -> dict:
    return _do_convert(df, column, target_type)


# ─────────────────────────────────────────
# 5. CONVERSION INTERNE
# ─────────────────────────────────────────
def _do_convert(df: pl.DataFrame, column: str, target_type: str) -> dict:
    if column not in df.columns:
        return {"error": f"Colonne '{column}' introuvable."}

    if target_type not in SUPPORTED_TYPES:
        return {"error": f"Type '{target_type}' non supporté. Choix : {SUPPORTED_TYPES}"}

    TYPE_MAP = {
        "Int64":    pl.Int64,
        "Float64":  pl.Float64,
        "String":   pl.String,
        "Boolean":  pl.Boolean,
        "Date":     pl.Date,
        "Datetime": pl.Datetime
    }

    original_type = str(df[column].dtype)

    try:
        if target_type == "Date":
            df = df.with_columns(
                pl.col(column).str.to_date(strict=False).alias(column)
            )
        elif target_type == "Datetime":
            df = df.with_columns(
                pl.col(column).str.to_datetime(strict=False).alias(column)
            )
        elif target_type == "Boolean":
            df = df.with_columns(
                pl.col(column)
                  .cast(pl.String)
                  .str.to_lowercase()
                  .map_elements(
                      lambda v: True  if v in ("true", "1", "oui", "yes") else
                                False if v in ("false", "0", "non", "no") else None,
                      return_dtype=pl.Boolean
                  )
                  .alias(column)
            )
        else:
            df = df.with_columns(
                pl.col(column).cast(TYPE_MAP[target_type], strict=False).alias(column)
            )

        null_after = int(df[column].null_count())

        return {
            "df":                  df,
            "column":              column,
            "original_type":       original_type,
            "new_type":            target_type,
            "rows":                df.shape[0],
            "conversion_failures": null_after,
            "message": (
                f"Colonne '{column}' convertie {original_type} → {target_type}. "
                f"{null_after} valeur(s) non convertible(s) mise(s) à null."
            )
        }

    except Exception as e:
        return {"error": f"Erreur lors de la conversion : {str(e)}"}


# ─────────────────────────────────────────
# 6. HELPER — aperçu sans NaN
# ─────────────────────────────────────────
def safe_preview(df: pl.DataFrame, n: int = 5) -> list:
    result = []
    for row in df.head(n).to_dicts():
        result.append({
            k: (None if isinstance(v, float) and v != v else v)
            for k, v in row.items()
        })
    return result