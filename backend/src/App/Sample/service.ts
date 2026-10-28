import { ApolloError } from "apollo-server-express";
import { Sample } from "./model";
import File from "../File/model/file.model";
import { ensureProjectAccess } from "../Project/helpers";
import { postDataToFastApi } from "../../Helpers/ThirdPartFastApiHelper";
import {
  CreateSampleInput,
  GetSampleByIdInput,
  GetSamplesByFileIdInput,
  GetSamplesResponse,
  UpdateSampleInput,
  SimpleRandomSamplingFastApiData,
  SimpleRandomSamplingInput,
  SimpleRandomSamplingResponse,
  BootstrapSamplingFastApiData,
  BootstrapSamplingInput,
  BootstrapSamplingResult,
  QuotaSamplingFastApiData,
  QuotaSamplingInput,
  QuotaSamplingResult,
  SamplingExecutionResponse,
  StratifiedSamplingFastApiData,
  StratifiedSamplingInput,
  StratifiedSamplingResult,
  SystematicSamplingFastApiData,
  SystematicSamplingInput,
  SystematicSamplingResult,
} from "./types";

type FastApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T | null;
};

type SamplingFile = {
  minioId: string;
  projectId: string;
};

export type SamplingDependencies = {
  findFileByPk: (
    fileId: string
  ) => Promise<SamplingFile | null>;
  ensureAccess: (
    projectId: string,
    userId: string,
    requireOwner?: boolean
  ) => Promise<unknown>;
  postData: (
    endpoint: string,
    options: { body: Record<string, unknown> }
  ) => Promise<FastApiResponse<unknown>>;
};

export type SimpleRandomSamplingDependencies = SamplingDependencies;

const getSamplingDependencies = (): SamplingDependencies => ({
    findFileByPk: (fileId) => File.findByPk(fileId),
    ensureAccess: ensureProjectAccess,
    postData: (endpoint, options) =>
      postDataToFastApi(endpoint, options) as Promise<FastApiResponse<unknown>>,
  });

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const mapSimpleRandomSamplingResult = (
  data: SimpleRandomSamplingFastApiData
) => ({
  fileId: data.file_id,
  source: data.source,
  output: data.output,
  hasPreview: data.has_preview,
  method: data.method,
  totalRows: data.total_rows,
  sampleSize: data.sample_size,
  sizeMode: data.size_mode,
  sizeValue: data.size_value,
  seed: data.seed,
  confidence: data.confidence,
  selectedIndices: data.selected_indices,
  rows: data.rows,
  columns: data.columns,
  preview: data.preview,
  data: data.data,
});

const mapSystematicSamplingResult = (
  data: SystematicSamplingFastApiData
): SystematicSamplingResult => ({
  ...mapSimpleRandomSamplingResult(data),
  k: data.k,
  offset: data.offset,
});

const mapBootstrapSamplingResult = (
  data: BootstrapSamplingFastApiData
): BootstrapSamplingResult => ({
  fileId: data.file_id,
  message: data.message,
  rowsOriginal: data.rows_original,
  rowsSampled: data.rows_sampled,
  marginOfError: data.marge_erreur,
  confidenceLevel: data.niveau_confiance,
  preview: data.preview,
});

const mapStratifiedSamplingResult = (
  data: StratifiedSamplingFastApiData
): StratifiedSamplingResult => ({
  ...mapBootstrapSamplingResult(data),
  strateColumn: data.strate_col,
  modalities: Array.isArray(data.modalites) ? data.modalites : [],
});

const mapQuotaSamplingResult = (
  data: QuotaSamplingFastApiData
): QuotaSamplingResult => ({
  fileId: data.file_id,
  source: data.source,
  output: data.output,
  hasPreview: data.has_preview,
  method: data.method,
  totalRows: data.total_rows,
  sampleSize: data.sample_size,
  seed: data.seed,
  confidence: data.confidence,
  quotaColumns: data.quota_columns,
  quotaResults: data.quota_results,
  selectedIndices: data.selected_indices,
  rows: data.rows,
  columns: data.columns,
  preview: data.preview,
  data: data.data,
});

const applySamplingPreview = async (
  datasetId: string,
  dependencies: SamplingDependencies
) => {
  try {
    const response = await dependencies.postData("dataset/apply-preview", {
      body: { dataset_id: datasetId },
    });
    if (!response.success) {
      throw new Error(response.message || "APPLY PREVIEW FAILED");
    }
  } catch (error) {
    await dependencies
      .postData("dataset/cancel-preview", {
        body: { dataset_id: datasetId },
      })
      .catch(() => undefined);
    throw error;
  }
};

const executeSampling = async <TFastApi, TResult>(
  fileId: string,
  userId: string,
  endpoint: string,
  buildBody: (datasetId: string) => Record<string, unknown>,
  mapper: (data: TFastApi) => TResult,
  fallbackMessage: string,
  dependencies: SamplingDependencies
): Promise<SamplingExecutionResponse<TResult>> => {
  const file = await dependencies.findFileByPk(fileId);
  if (!file) {
    return { success: false, message: "FILE NOT FOUND", data: null };
  }

  try {
    await dependencies.ensureAccess(file.projectId, userId, false);
    const response = (await dependencies.postData(endpoint, {
      body: buildBody(file.minioId),
    })) as FastApiResponse<TFastApi>;

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || fallbackMessage,
        data: null,
      };
    }

    await applySamplingPreview(file.minioId, dependencies);
    return {
      success: true,
      message: response.message,
      data: mapper(response.data),
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, fallbackMessage),
      data: null,
    };
  }
};

export const executeSimpleRandomSampling = async (
  input: SimpleRandomSamplingInput,
  userId: string,
  dependencies: SamplingDependencies = getSamplingDependencies()
): Promise<SimpleRandomSamplingResponse> => {
  return executeSampling(
    input.fileId,
    userId,
    "sampling/simple-random",
    (datasetId) => ({
      file_id: datasetId,
      size: input.size,
      size_mode: input.sizeMode ?? "n",
      seed: input.seed ?? 42,
      confidence: input.confidence ?? 95,
    }),
    mapSimpleRandomSamplingResult,
    "SIMPLE RANDOM SAMPLING FAILED",
    dependencies
  );
};

export const executeSystematicSampling = (
  input: SystematicSamplingInput,
  userId: string,
  dependencies: SamplingDependencies = getSamplingDependencies()
) =>
  executeSampling<SystematicSamplingFastApiData, SystematicSamplingResult>(
    input.fileId,
    userId,
    "sampling/systematic",
    (datasetId) => ({
      file_id: datasetId,
      size: input.size,
      size_mode: input.sizeMode ?? "n",
      seed: input.seed ?? 42,
      confidence: input.confidence ?? 95,
    }),
    mapSystematicSamplingResult,
    "SYSTEMATIC SAMPLING FAILED",
    dependencies
  );

export const executeBootstrapSampling = (
  input: BootstrapSamplingInput,
  userId: string,
  dependencies: SamplingDependencies = getSamplingDependencies()
) =>
  executeSampling<BootstrapSamplingFastApiData, BootstrapSamplingResult>(
    input.fileId,
    userId,
    "sampling/bootstrap",
    (datasetId) => ({ dataset_id: datasetId, n: input.sampleSize }),
    mapBootstrapSamplingResult,
    "BOOTSTRAP SAMPLING FAILED",
    dependencies
  );

export const executeStratifiedSampling = (
  input: StratifiedSamplingInput,
  userId: string,
  dependencies: SamplingDependencies = getSamplingDependencies()
) =>
  executeSampling<StratifiedSamplingFastApiData, StratifiedSamplingResult>(
    input.fileId,
    userId,
    "sampling/stratified",
    (datasetId) => ({
      dataset_id: datasetId,
      strate_col: input.strateColumn,
      n: input.sampleSize ?? null,
      mode: input.mode ?? "proportionnel",
    }),
    mapStratifiedSamplingResult,
    "STRATIFIED SAMPLING FAILED",
    dependencies
  );

export const executeQuotaSampling = (
  input: QuotaSamplingInput,
  userId: string,
  dependencies: SamplingDependencies = getSamplingDependencies()
) =>
  executeSampling<QuotaSamplingFastApiData, QuotaSamplingResult>(
    input.fileId,
    userId,
    "sampling/quotas",
    (datasetId) => ({
      file_id: datasetId,
      quota_columns: input.quotaColumns,
      quotas: input.quotas.map(({ values, target }) => ({ values, target })),
      seed: input.seed ?? 42,
      confidence: input.confidence ?? 95,
      allow_underfilled: input.allowUnderfilled ?? false,
    }),
    mapQuotaSamplingResult,
    "QUOTA SAMPLING FAILED",
    dependencies
  );

export const createSample = async (input: CreateSampleInput) => {
  const sample = await Sample.create({
    ...input,
    isActive: input.isActive ?? true,
  });

  return {
    success: true,
    message: "SAMPLE CREATED",
    sample,
  };
};

export const getSamples = async (): Promise<GetSamplesResponse> => {
  return await Sample.findAndCountAll({
    order: [["createdAt", "DESC"]],
  });
};

export const getSampleById = async (input: GetSampleByIdInput) => {
  try {
    const sample = await Sample.findByPk(input.sampleId);

    if (!sample) {
      throw new ApolloError("SAMPLE NOT FOUND");
    }

    return {
      success: true,
      message: "SAMPLE FOUND",
      sample,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        sample: null,
      };
    }

    throw error;
  }
};

export const getSamplesByFileId = async (
  input: GetSamplesByFileIdInput
): Promise<GetSamplesResponse> => {
  return await Sample.findAndCountAll({
    where: { fileId: input.fileId },
    order: [["createdAt", "DESC"]],
  });
};

export const updateSample = async (input: UpdateSampleInput) => {
  try {
    const { sampleId, ...data } = input;
    const sample = await Sample.findByPk(sampleId);

    if (!sample) {
      throw new ApolloError("SAMPLE NOT FOUND");
    }

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        sample[key] = data[key];
      }
    });

    await sample.save();

    return {
      success: true,
      message: "SAMPLE UPDATED",
      sample,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        sample: null,
      };
    }

    throw error;
  }
};

export const deleteSample = async (sampleId: string) => {
  try {
    const sample = await Sample.findByPk(sampleId);

    if (!sample) {
      throw new ApolloError("SAMPLE NOT FOUND");
    }

    await sample.destroy();

    return {
      success: true,
      message: "SAMPLE DELETED",
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
