import io
import polars as pl
from botocore.exceptions import ClientError
from backend.storage.minio_client import s3, BUCKET

STAGES = {"original", "current", "preview"}


def _key(dataset_id: str, stage: str = "current") -> str:
    if stage not in STAGES:
        raise ValueError(f"Stage invalide: {stage} (attendu: {STAGES})")
    return f"{dataset_id}/{stage}.csv"


def save_dataset(dataset_id: str, df: pl.DataFrame, stage: str = "current") -> None:
    csv_bytes = df.write_csv().encode()
    s3.put_object(Bucket=BUCKET, Key=_key(dataset_id, stage), Body=csv_bytes)


def get_dataset(dataset_id: str, stage: str = "current") -> pl.DataFrame | None:
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=_key(dataset_id, stage))
        data = obj["Body"].read()
        return pl.read_csv(io.BytesIO(data))
    except ClientError:
        return None


def update_dataset(dataset_id: str, df: pl.DataFrame, stage: str = "current") -> None:
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


def init_dataset(dataset_id: str, df: pl.DataFrame) -> None:
    """À appeler une seule fois, juste après l'upload initial.
    Crée 'original' et 'current' identiques. Aucun 'preview' à ce stade."""
    save_dataset(dataset_id, df, stage="original")
    save_dataset(dataset_id, df, stage="current")


def apply_preview(dataset_id: str) -> pl.DataFrame:
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