import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

const getRequiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getMinioEndpoint = () => {
  if (process.env.MINIO_ENDPOINT) {
    return process.env.MINIO_ENDPOINT;
  }

  const host = getRequiredEnv("MINIO_HOST");
  const port = process.env.MINIO_PORT;
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";

  return `${protocol}://${host}${port ? `:${port}` : ""}`;
};

let minioClient: S3Client | null = null;

const getMinioClient = () => {
  if (!minioClient) {
    minioClient = new S3Client({
      region: process.env.MINIO_REGION || "us-east-1",
      endpoint: getMinioEndpoint(),
      forcePathStyle: true,
      credentials: {
        accessKeyId: getRequiredEnv("MINIO_ACCESS_KEY"),
        secretAccessKey: getRequiredEnv("MINIO_SECRET_KEY"),
      },
    });
  }

  return minioClient;
};

const getBucketName = () => getRequiredEnv("MINIO_BUCKET");

const getDatasetObjectKey = (datasetId: string, stage: string) =>
  `${datasetId}/${stage}.csv`;

const ensureBucketExists = async (bucket: string) => {
  const client = getMinioClient();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error: any) {
    const statusCode = error?.$metadata?.httpStatusCode;

    if (statusCode === 404 || error?.name === "NotFound") {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      return;
    }

    throw error;
  }
};

export const uploadFileToMinio = async (file: Express.Multer.File) => {
  const bucket = getBucketName();
  await ensureBucketExists(bucket);

  const originalExtension = path.extname(file.originalname);
  const objectKey = `${randomUUID()}${originalExtension}`;

  await getMinioClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: file.buffer,
      ContentLength: file.size,
      ContentType: file.mimetype,
    })
  );

  return objectKey;
};

const objectExists = async (bucket: string, key: string) => {
  try {
    await getMinioClient().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error: any) {
    const statusCode = error?.$metadata?.httpStatusCode;

    if (statusCode === 404 || error?.name === "NotFound") {
      return false;
    }

    throw error;
  }
};

const deleteObject = async (bucket: string, key: string) => {
  await getMinioClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

export const deleteDatasetFromMinio = async (datasetId: string) => {
  const bucket = getBucketName();
  const previewKey = getDatasetObjectKey(datasetId, "preview");

  await Promise.all([
    deleteObject(bucket, getDatasetObjectKey(datasetId, "original")),
    deleteObject(bucket, getDatasetObjectKey(datasetId, "current")),
    objectExists(bucket, previewKey).then((exists) =>
      exists ? deleteObject(bucket, previewKey) : undefined
    ),
  ]);
};

export const getDatasetObjectSize = async (
  datasetId: string,
  stage = "current"
) => {
  const response = await getMinioClient().send(
    new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: getDatasetObjectKey(datasetId, stage),
    })
  );

  if (response.ContentLength === undefined) {
    throw new Error(
      `MINIO DATASET SIZE IS UNAVAILABLE: ${datasetId}/${stage}.csv`
    );
  }

  return response.ContentLength;
};
