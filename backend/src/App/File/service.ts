import { ApolloError } from "apollo-server-express";
import axios from "axios";
import { Request, Response } from "express";
import FormData from "form-data";
import { Op, Transaction } from "sequelize";
import { File } from "./model";
import { sequelize } from "../../Config/database";
import { createFeaturesFromUpload } from "../Feature/service";
import { ensureProjectAccess } from "../Project/helpers";
import {
  FilesPage,
  ExecuteFileMergeInput,
  FileMergeExecution,
  FileMergeKeyCandidate,
  FileMergePreview,
  FileMergeRecommendation,
  FileMergeStatistics,
  FileMergeTypeConflict,
  GetFileByIdInput,
  GetFilesByProjectInput,
  GetFilesOptions,
  GetFilesResponse,
  PreviewFileMergeInput,
  RecommendFileMergeInput,
  UpdateFileInput,
} from "./types";
import {
  deleteDatasetFromMinio,
  getDatasetObjectSize,
} from "./minio.service";
import { getFastApiConfig } from "../../Helpers/GeneralHelpers";
import {
  getDataFromFastApi,
  getFastApiToken,
  postDataToFastApi,
} from "../../Helpers/ThirdPartFastApiHelper";
import type { FileInstance } from "./model/file.model";

type FastApiUploadData = {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  columns: string[];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
  preview: Record<string, unknown>[];
};

type FastApiUploadResponse = {
  success: boolean;
  message: string;
  data?: FastApiUploadData | null;
};


const uploadFileToFastApi = async (
  file: Express.Multer.File,
) => {
  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
    knownLength: file.size,
  });

  const fastApiToken = await getFastApiToken();
  const { fastApiUrl } = getFastApiConfig();

  if (!fastApiUrl) {
    throw new Error("FAST API IS NOT CONFIGURED!");
  }

  const response = await axios.post<FastApiUploadResponse>(
    `${fastApiUrl}/upload`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${fastApiToken}`,
        Accept: "application/json",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    }
  );

  if (
    response.status < 200 ||
    response.status >= 300 ||
    !response.data?.success ||
    !response.data.data?.dataset_id
  ) {
    throw new Error(
      response.data?.message ||
        `FastAPI upload failed with status ${response.status}`
    );
  }

  return response.data.data;
};

export const createFile = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({
      success: false,
      message: "NO FILE PROVIDED",
      file: null,
    });
  }

  const projectId = req.body.projectId;

  let uploadResult: FastApiUploadData;

  try {
    uploadResult = await uploadFileToFastApi(req.file);
  } catch (error: any) {
    console.log(error);
    // Rendre visible la vraie cause (status + body) côté backend.
    const status = error?.response?.status;
    const data = error?.response?.data;
    const msg = error?.message;

    return res.status(502).send({
      success: false,
      message: "FASTAPI UPLOAD FAILED",
      file: null,
      fastApi: {
        status,
        message: msg,
        data,
      },
    });
  }


  try {
    const result = await sequelize.transaction(async (transaction) => {
      const file = await File.create(
        {
          name: req.body.name || req.file.originalname,
          type: req.body.type || req.file.mimetype,
          size: req.file.size,
          minioId: uploadResult.dataset_id,
          projectId: projectId,
        },
        { transaction }
      );

      await createFeaturesFromUpload(
        file.id,
        uploadResult,
        transaction
      );

      return file;
    });

    return res.status(201).send({
      success: true,
      message: "FILE CREATED",
      file: result,
    });
  } catch (error) {
    console.error("Database file/feature creation failed:", error);

    return res.status(500).send({
      success: false,
      message: "DATABASE FILE CREATION FAILED",
      file: null,
    });
  }
};

export const getFiles = async (
  args: GetFilesOptions,
  userId: string
): Promise<GetFilesResponse> => {
  const { page = 1, limit = 10, filter } = args;
  const offset = (page - 1) * limit;

  if ( !filter|| !filter.projectId ) {
    throw new ApolloError("PROJECT ID IS REQUIRED");
  }

  // Vérifie que l'utilisateur a bien accès à ce projet avant de lister ses fichiers
  await ensureProjectAccess(filter.projectId, userId, false);

  const where: any = {
    projectId: filter.projectId,
  };

  if (filter.id) {
    where.id = filter.id;
  }

  if (filter.name) {
    where.name = { [Op.iLike]: `%${filter.name}%` };
  }

  if (filter.type) {
    where.type = { [Op.iLike]: `%${filter.type}%` };
  }

 
  return await File.findAndCountAll({
    where,
    offset,
    limit,
    order: [["createdAt", "DESC"]],
  });
};

export type GetFilesByProjectDependencies = {
  ensureAccess: (
    projectId: string,
    userId: string,
    requireOwner?: boolean
  ) => Promise<unknown>;
  findAndCountAll: (options: {
    where: { projectId: string };
    offset: number;
    limit: number;
    order: Array<[string, string]>;
  }) => Promise<{ rows: FileInstance[]; count: number }>;
};

const getFilesByProjectDefaultDependencies =
  (): GetFilesByProjectDependencies => ({
    ensureAccess: ensureProjectAccess,
    findAndCountAll: (options) => File.findAndCountAll(options),
  });

export const getFilesByProject = async (
  input: GetFilesByProjectInput,
  userId: string,
  dependencies: GetFilesByProjectDependencies =
    getFilesByProjectDefaultDependencies()
): Promise<FilesPage> => {
  const { projectId, page = 1, limit = 20 } = input;

  await dependencies.ensureAccess(projectId, userId, false);

  const { rows, count } = await dependencies.findAndCountAll({
    where: { projectId },
    offset: (page - 1) * limit,
    limit,
    order: [["createdAt", "DESC"]],
  });

  return {
    rows,
    count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

export const getFileById = async (input: GetFileByIdInput) => {
  try {
    const file = await File.findByPk(input.fileId);

    if (!file) {
      throw new ApolloError("FILE NOT FOUND");
    }

    return {
      success: true,
      message: "FILE FOUND",
      file,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        file: null,
      };
    }

    throw error;
  }
};

type FastApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T | null;
};

type FastApiTypeConflict = {
  column: string;
  left_type: string;
  right_type: string;
};

type FastApiKeyCandidate = {
  columns: string[];
  left_uniqueness: number;
  right_uniqueness: number;
  overlap_score: number;
  duplicate_risk: string;
};

type FastApiStatistics = {
  left_rows: number;
  right_rows: number;
  result_rows: number;
  matched_left_rows?: number | null;
  unmatched_left_rows?: number | null;
  matched_right_rows?: number | null;
  unmatched_right_rows?: number | null;
  updated_rows?: number | null;
  inserted_rows?: number | null;
  left_duplicate_keys?: number | null;
  right_duplicate_keys?: number | null;
};

type FastApiRecommendation = {
  recommended_operation: FileMergeRecommendation["recommendedOperation"];
  confidence_score: number;
  reasons: string[];
  warnings: string[];
  common_columns: string[];
  left_only_columns: string[];
  right_only_columns: string[];
  type_conflicts: FastApiTypeConflict[];
  candidate_keys: FastApiKeyCandidate[];
  operation_scores: {
    CONCAT_VERTICAL: number;
    JOIN_BY_KEY: number;
    UPSERT: number;
    MANUAL_REVIEW: number;
  };
  schema_similarity: number;
  left_shape: { rows: number; columns: number };
  right_shape: { rows: number; columns: number };
};

type FastApiPreview = {
  operation: FileMergePreview["operation"];
  columns: string[];
  rows: number;
  preview: Record<string, unknown>[];
  warnings: string[];
  type_conflicts: FastApiTypeConflict[];
  statistics: FastApiStatistics;
};

type FastApiExecution = FastApiPreview & {
  dataset_id: string;
  left_file_id: string;
  right_file_id: string;
  created_objects: string[];
};

type FastApiDtypes = {
  file_id: string;
  dtypes: Record<string, string>;
};

type FileMergeSource = Pick<
  FileInstance,
  "id" | "name" | "minioId" | "projectId"
>;

type CreateFileValues = {
  name: string;
  type: string;
  size: number;
  minioId: string;
  projectId: string;
};

type FileMergeDependencies = {
  ensureProjectAccess: (
    projectId: string,
    userId: string,
    requireOwner?: boolean
  ) => Promise<unknown>;
  findFileByPk: (fileId: string) => Promise<FileMergeSource | null>;
  postData: (
    url: string,
    options: { body: Record<string, unknown> }
  ) => Promise<unknown>;
  getData: (url: string) => Promise<unknown>;
  getDatasetSize: (datasetId: string, stage?: string) => Promise<number>;
  transaction: <T>(
    callback: (transaction: Transaction) => Promise<T>
  ) => Promise<T>;
  createFile: (
    values: CreateFileValues,
    transaction: Transaction
  ) => Promise<FileInstance>;
  createFeatures: (
    fileId: string,
    metadata: { columns: string[]; dtypes: Record<string, string> },
    transaction: Transaction
  ) => Promise<unknown>;
};

const getDefaultDependencies = (): FileMergeDependencies => {
  return {
    ensureProjectAccess,
    findFileByPk: (fileId) => File.findByPk(fileId),
    postData: (url, options) => postDataToFastApi(url, options),
    getData: (url) => getDataFromFastApi(url),
    getDatasetSize: getDatasetObjectSize,
    transaction: (callback) => sequelize.transaction(callback),
    createFile: (values, transaction) => File.create(values, { transaction }),
    createFeatures: createFeaturesFromUpload,
  };
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "UNKNOWN FILE MERGE ERROR";

const validateAndResolveSources = async (
  input: RecommendFileMergeInput,
  userId: string,
  dependencies: FileMergeDependencies
): Promise<{
  leftFile: FileMergeSource;
  rightFile: FileMergeSource;
}> => {
  await dependencies.ensureProjectAccess(input.projectId, userId, false);

  if (input.leftFileId === input.rightFileId) {
    throw new Error("SOURCE FILES MUST BE DIFFERENT");
  }

  const leftFile = await dependencies.findFileByPk(input.leftFileId);
  if (!leftFile) {
    throw new Error("LEFT FILE NOT FOUND");
  }

  const rightFile = await dependencies.findFileByPk(input.rightFileId);
  if (!rightFile) {
    throw new Error("RIGHT FILE NOT FOUND");
  }

  if (
    leftFile.projectId !== input.projectId ||
    rightFile.projectId !== input.projectId
  ) {
    throw new Error("SOURCE FILE DOES NOT BELONG TO PROJECT");
  }

  return { leftFile, rightFile };
};

const buildFastApiSourcePayload = (
  leftFile: FileMergeSource,
  rightFile: FileMergeSource
) => ({
  left_file_id: leftFile.minioId,
  right_file_id: rightFile.minioId,
});

const requestFileMerge = async <T>(
  endpoint:
    | "file-merge/recommend"
    | "file-merge/preview"
    | "file-merge/execute",
  input: RecommendFileMergeInput,
  userId: string,
  dependencies: FileMergeDependencies,
  buildBody: (
    leftFile: FileMergeSource,
    rightFile: FileMergeSource
  ) => Record<string, unknown>
) => {
  const { leftFile, rightFile } = await validateAndResolveSources(
    input,
    userId,
    dependencies
  );
  const response = await dependencies.postData(endpoint, {
    body: buildBody(leftFile, rightFile),
  }) as FastApiResponse<T>;

  return response;
};

const fileMergeDataFailure = (error: unknown) => ({
  success: false,
  message: errorMessage(error),
  data: null,
});

const mapTypeConflict = (
  conflict: FastApiTypeConflict
): FileMergeTypeConflict => ({
  column: conflict.column,
  leftType: conflict.left_type,
  rightType: conflict.right_type,
});

const mapKeyCandidate = (
  candidate: FastApiKeyCandidate
): FileMergeKeyCandidate => ({
  columns: candidate.columns,
  leftUniqueness: candidate.left_uniqueness,
  rightUniqueness: candidate.right_uniqueness,
  overlapScore: candidate.overlap_score,
  duplicateRisk: candidate.duplicate_risk,
});

const mapStatistics = (
  statistics: FastApiStatistics
): FileMergeStatistics => ({
  leftRows: statistics.left_rows,
  rightRows: statistics.right_rows,
  resultRows: statistics.result_rows,
  matchedLeftRows: statistics.matched_left_rows,
  unmatchedLeftRows: statistics.unmatched_left_rows,
  matchedRightRows: statistics.matched_right_rows,
  unmatchedRightRows: statistics.unmatched_right_rows,
  updatedRows: statistics.updated_rows,
  insertedRows: statistics.inserted_rows,
  leftDuplicateKeys: statistics.left_duplicate_keys,
  rightDuplicateKeys: statistics.right_duplicate_keys,
});

const mapRecommendation = (
  data: FastApiRecommendation
): FileMergeRecommendation => ({
  recommendedOperation: data.recommended_operation,
  confidenceScore: data.confidence_score,
  reasons: data.reasons,
  warnings: data.warnings,
  commonColumns: data.common_columns,
  leftOnlyColumns: data.left_only_columns,
  rightOnlyColumns: data.right_only_columns,
  typeConflicts: data.type_conflicts.map(mapTypeConflict),
  candidateKeys: data.candidate_keys.map(mapKeyCandidate),
  operationScores: {
    concatVertical: data.operation_scores.CONCAT_VERTICAL,
    joinByKey: data.operation_scores.JOIN_BY_KEY,
    upsert: data.operation_scores.UPSERT,
    manualReview: data.operation_scores.MANUAL_REVIEW,
  },
  schemaSimilarity: data.schema_similarity,
  leftShape: data.left_shape,
  rightShape: data.right_shape,
});

const mapPreview = (data: FastApiPreview): FileMergePreview => ({
  operation: data.operation,
  columns: data.columns,
  rows: data.rows,
  preview: data.preview,
  warnings: data.warnings,
  typeConflicts: data.type_conflicts.map(mapTypeConflict),
  statistics: mapStatistics(data.statistics),
});

const buildFastApiConfiguration = (
  input: PreviewFileMergeInput,
  leftFile: FileMergeSource,
  rightFile: FileMergeSource
) => ({
  ...buildFastApiSourcePayload(leftFile, rightFile),
  operation: input.operation,
  column_mapping: input.columnMapping,
  join_keys: input.joinKeys,
  join_type: input.joinType,
  add_source_column: input.addSourceColumn,
  source_column_name: input.sourceColumnName,
  left_source_label: leftFile.name,
  right_source_label: rightFile.name,
  preview_limit: input.previewLimit,
  right_precedence: input.rightPrecedence,
  update_non_null_only: input.updateNonNullOnly,
});

export const recommendFileMerge = async (
  input: RecommendFileMergeInput,
  userId: string,
  dependencies?: FileMergeDependencies
) => {
  const resolvedDependencies = dependencies ?? getDefaultDependencies();
  try {
    const response = await requestFileMerge<FastApiRecommendation>(
      "file-merge/recommend",
      input,
      userId,
      resolvedDependencies,
      buildFastApiSourcePayload
    );

    if (!response.data) {
      throw new Error(response.message || "FILE MERGE RECOMMENDATION RETURNED NO DATA");
    }

    return {
      success: true,
      message: response.message,
      data: mapRecommendation(response.data),
    };
  } catch (error) {
    return fileMergeDataFailure(error);
  }
};

export const previewFileMerge = async (
  input: PreviewFileMergeInput,
  userId: string,
  dependencies?: FileMergeDependencies
) => {
  const resolvedDependencies = dependencies ?? getDefaultDependencies();
  try {
    const response = await requestFileMerge<FastApiPreview>(
      "file-merge/preview",
      input,
      userId,
      resolvedDependencies,
      (leftFile, rightFile) =>
        buildFastApiConfiguration(input, leftFile, rightFile)
    );

    if (!response.data) {
      throw new Error(response.message || "FILE MERGE PREVIEW RETURNED NO DATA");
    }

    return {
      success: true,
      message: response.message,
      data: mapPreview(response.data),
    };
  } catch (error) {
    return fileMergeDataFailure(error);
  }
};

export const executeFileMerge = async (
  input: ExecuteFileMergeInput,
  userId: string,
  dependencies?: FileMergeDependencies
) => {
  const resolvedDependencies = dependencies ?? getDefaultDependencies();
  let outputDatasetId: string | null = null;

  try {
    const response = await requestFileMerge<FastApiExecution>(
      "file-merge/execute",
      input,
      userId,
      resolvedDependencies,
      (leftFile, rightFile) =>
        buildFastApiConfiguration(input, leftFile, rightFile)
    );

    if (!response.data?.dataset_id) {
      throw new Error(response.message || "FILE MERGE EXECUTION RETURNED NO DATASET ID");
    }
    outputDatasetId = response.data.dataset_id;

    const dtypesResponse = await resolvedDependencies.getData(
      `files/${encodeURIComponent(outputDatasetId)}/dtypes`
    ) as FastApiResponse<FastApiDtypes>;
    if (
      !dtypesResponse.data ||
      dtypesResponse.data.file_id !== outputDatasetId
    ) {
      throw new Error("OUTPUT DATASET VERIFICATION FAILED");
    }

    const size = await resolvedDependencies.getDatasetSize(
      outputDatasetId,
      "current"
    );
    if (!Number.isFinite(size) || size < 0) {
      throw new Error("OUTPUT DATASET SIZE IS INVALID");
    }

    let file: FileInstance;
    try {
      file = await resolvedDependencies.transaction(async (transaction) => {
        const createdFile = await resolvedDependencies.createFile(
          {
            name: input.outputName,
            type: "text/csv",
            size,
            minioId: outputDatasetId as string,
            projectId: input.projectId,
          },
          transaction
        );

        await resolvedDependencies.createFeatures(
          createdFile.id,
          {
            columns: response.data!.columns,
            dtypes: dtypesResponse.data!.dtypes,
          },
          transaction
        );

        return createdFile;
      });
    } catch (error) {
      return {
        success: false,
        message:
          `DATABASE FILE CREATION FAILED AFTER FASTAPI EXECUTION; ` +
          `MINIO DATASET ${outputDatasetId} MAY BE ORPHANED: ${errorMessage(error)}`,
        file: null,
        data: null,
      };
    }

    const execution: FileMergeExecution = {
      ...mapPreview(response.data),
      outputDatasetId,
      leftFileId: input.leftFileId,
      rightFileId: input.rightFileId,
      createdObjects: response.data.created_objects,
    };

    return {
      success: true,
      message: response.message,
      file,
      data: execution,
    };
  } catch (error) {
    const orphanWarning = outputDatasetId
      ? ` MINIO DATASET ${outputDatasetId} MAY BE ORPHANED.`
      : "";
    return {
      success: false,
      message: `${errorMessage(error)}${orphanWarning}`,
      file: null,
      data: null,
    };
  }
};


export const updateFile = async (input: UpdateFileInput) => {
  try {
    const { fileId, name } = input;

    const file = await File.findByPk(fileId);

    if (!file) {
      throw new ApolloError("FILE NOT FOUND");
    }

    if (!name) {
      throw new ApolloError("FILE NAME IS REQUIRED");
    }

    file.name = name;
    await file.save();

    return {
      success: true,
      message: "FILE UPDATED",
      file,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        file: null,
      };
    }

    throw error;
  }
};

export const deleteFile = async (fileId: string) => {
  try {
    const file = await File.findByPk(fileId);

    if (!file) {
      throw new ApolloError("FILE NOT FOUND");
    }

    try {
      await deleteDatasetFromMinio(file.minioId);
    } catch (error) {
      console.error("MinIO file deletion failed:", error);
      throw new ApolloError("MINIO FILE DELETION FAILED");
    }

    try {
      await file.destroy();
    } catch (error) {
      console.error("Database file deletion failed:", error);
      throw new ApolloError("DATABASE FILE DELETION FAILED");
    }

    return {
      success: true,
      message: "FILE DELETED",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
      };
    }

    throw error;
  }
};
