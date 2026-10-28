import io
from botocore.exceptions import ClientError
from storage.minio_client import s3, BUCKET
import pandas as pd
from services.file_parser_service import detect_csv_separator
from fastapi import HTTPException
STAGES = {"original", "current", "preview"}


def _key(dataset_id: str, stage: str = "current") -> str:
    if stage not in STAGES:
        raise ValueError(f"Stage invalide: {stage} (attendu: {STAGES})")
    return f"{dataset_id}/{stage}.csv"

def ensure_bucket_exists():
    try:
        s3.head_bucket(Bucket=BUCKET)
    except ClientError as e:
        error_code = int(e.response["Error"]["Code"])
        
        if error_code == 404:
            s3.create_bucket(Bucket=BUCKET)
        else:
            raise

def save_dataset(dataset_id: str, df:pd.DataFrame, stage: str = "current") -> None:
    ensure_bucket_exists()
    csv_bytes = df.to_csv(index=False).encode()
    s3.put_object(Bucket=BUCKET, Key=_key(dataset_id, stage), Body=csv_bytes)


def get_dataset(dataset_id: str, stage: str = "current") -> pd.DataFrame:
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=_key(dataset_id, stage))
        data = obj["Body"].read()

        separator = detect_csv_separator(data)

        return pd.read_csv(io.BytesIO(data), sep=separator)

    except ClientError:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_id}' not found"
        )

def update_dataset(dataset_id: str, df: pd.DataFrame, stage: str = "current") -> None:
    save_dataset(dataset_id, df, stage)


def delete_dataset(dataset_id: str, stage: str = "current") -> None:
    try:
        s3.delete_object(Bucket=BUCKET, Key=_key(dataset_id, stage))
    except ClientError:
        pass


def dataset_exists(dataset_id: str, stage: str = "current") -> bool:
    try:
        s3.head_object(Bucket=BUCKET, Key=_key(dataset_id, stage))
        return True
    except ClientError:
        return False


def init_dataset(dataset_id: str, df: pd.DataFrame) -> None:
    """À appeler une seule fois, juste après l'upload initial.
    Crée 'original' et 'current' identiques. Aucun 'preview' à ce stade."""
    save_dataset(dataset_id, df, stage="original")
    save_dataset(dataset_id, df, stage="current")


def apply_preview(dataset_id: str) -> pd.DataFrame:
    """Le contenu de 'preview' remplace 'current', puis 'preview' est supprimé.
    Lève FileNotFoundError si aucun preview n'est en attente."""
    df = get_dataset(dataset_id, stage="preview")
    if df is None:
        raise FileNotFoundError(f"Aucun preview en attente pour le dataset {dataset_id}")
    save_dataset(dataset_id, df, stage="current")
    delete_dataset(dataset_id, stage="preview")
    return df


def cancel_preview(dataset_id: str) -> None:
    """Supprime 'preview' sans toucher à 'current' (sortie de page sans Apply)."""
    delete_dataset(dataset_id, stage="preview")