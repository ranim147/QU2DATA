import io
import polars as pl
from botocore.exceptions import ClientError
from backend.storage.minio_client import s3, BUCKET


def save_dataset(dataset_id: str, df: pl.DataFrame) -> None:
    csv_bytes = df.write_csv().encode()
    s3.put_object(Bucket=BUCKET, Key=f"{dataset_id}.csv", Body=csv_bytes)


def get_dataset(dataset_id: str) -> pl.DataFrame | None:
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=f"{dataset_id}.csv")
        data = obj["Body"].read()
        return pl.read_csv(io.BytesIO(data))
    except ClientError:
        return None


def update_dataset(dataset_id: str, df: pl.DataFrame) -> None:
    save_dataset(dataset_id, df)


def delete_dataset(dataset_id: str) -> None:
    try:
        s3.delete_object(Bucket=BUCKET, Key=f"{dataset_id}.csv")
    except ClientError:
        pass