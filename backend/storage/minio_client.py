import os
import boto3
from botocore.client import Config

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("MINIO_ENDPOINT", "http://localhost:9000"),
    aws_access_key_id=os.getenv("MINIO_USER", "minioadmin"),
    aws_secret_access_key=os.getenv("MINIO_PASSWORD", "minioadmin"),
    region_name="us-east-1",
    config=Config(signature_version="s3v4"),
)

BUCKET = os.getenv("MINIO_BUCKET", "datasets")