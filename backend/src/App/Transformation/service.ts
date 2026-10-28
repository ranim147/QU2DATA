import { ApolloError } from "apollo-server-express";
import axios from "axios";
import { File } from "../File/model";
import { getFastApiConfig } from "../../Helpers/GeneralHelpers";
import {
  getDataFromFastApi,
  getFastApiToken,
  postDataToFastApi,
} from "../../Helpers/ThirdPartFastApiHelper";
import { Transformation } from "./model";
import {
  CreateTransformationInput,
  DeduplicationParameters,
  GetTransformationsInput,
  GetTransformationsResponse,
  UpdateTransformationInput,
  OutlierTreatmentParameters,
  StandardizationParameters,
  NormalizationParameters,
  OneHotEncodingParameters,
  LogTransformParameters,
  BinningParameters,
  RecodeParameters,
  ConcatParameters,
  CalculateParameters,
  AnalyzeDuplicatesInput,
  AnalyzeLogTransformInput,
  AnalyzeOutliersInput,
  DeduplicationAnalysisResult,
  DeduplicationFileInput,
  DeduplicationRecommendationItem,
  DeduplicationRecommendationResult,
  DeduplicationRemoveResult,
  GetDatasetInput,
  LogTransformAction,
  LogTransformColumnResult,
  LogTransformDetectionResult,
  LogTransformMethod,
  OutlierAnalysisResult,
  OutlierTreatmentResult,
  RowFilterInput,
  RowSortInput,
  RowViewInput,
  TypeCorrectionParameters,
  TypeCorrectionResult,
  TypeRecommendationItem,
} from "./types";
import {
  deduplicationParametersSchema,
  outlierTreatmentParametersSchema,
  standardizationParametersSchema,
  normalizationParametersSchema,
  oneHotEncodingParametersSchema,
  logTransformParametersSchema,
  binningParametersSchema,
  recodeParametersSchema,
  concatParametersSchema,
  calculateParametersSchema,
  typeCorrectionParametersSchema,
} from "./validators";

export const createTransformation = async (
  input: CreateTransformationInput
) => {
  try {
    const file = await File.findByPk(input.fileId);

    if (!file) {
      throw new ApolloError("FILE NOT FOUND");
    }

    let parameters = input.parameters;
    if (input.type === "OUTLIER_TREATMENT") {
      const parsedParameters = outlierTreatmentParametersSchema.safeParse(
        input.parameters
      );
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID OUTLIER TREATMENT PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "DEDUPLICATION") {
      const parsedParameters = deduplicationParametersSchema.safeParse(
        input.parameters
      );
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID DEDUPLICATION PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "STANDARDIZATION") {
      const parsedParameters = standardizationParametersSchema.safeParse(
        input.parameters
      );
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID STANDARDIZATION PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "NORMALIZATION") {
      const parsedParameters = normalizationParametersSchema.safeParse(
        input.parameters
      );
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID NORMALIZATION PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "ONE_HOT_ENCODING") {
      const parsedParameters = oneHotEncodingParametersSchema.safeParse(
        input.parameters
      );
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID ONE HOT ENCODING PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "LOG_TRANSFORM") {
      const parsedParameters = logTransformParametersSchema.safeParse(
        input.parameters
      );
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID LOG TRANSFORM PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "BINNING_COLUMN") {
      const parsedParameters = binningParametersSchema.safeParse(input.parameters);
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID BINNING PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "RECODE_COLUMN") {
      const parsedParameters = recodeParametersSchema.safeParse(input.parameters);
      if (!parsedParameters.success) {
        throw new ApolloError("INVALID RECODE PARAMETERS");
      }
      parameters = parsedParameters.data;
    }
    if (input.type === "CONCAT_COLUMNS" || input.type === "CALCULATE_COLUMN") {
      const isConcat = input.type === "CONCAT_COLUMNS";
      const parsedParameters = (isConcat ? concatParametersSchema : calculateParametersSchema).safeParse(input.parameters);
      if (!parsedParameters.success) throw new ApolloError(isConcat ? "INVALID CONCAT PARAMETERS" : "INVALID CALCULATE PARAMETERS");
      parameters = parsedParameters.data;
    }
    if (input.type === "TYPE_CORRECTION") { const parsed = typeCorrectionParametersSchema.safeParse(input.parameters); if (!parsed.success) throw new ApolloError("INVALID TYPE CORRECTION PARAMETERS"); parameters = parsed.data; }

    const transformation = await Transformation.create({
      name: input.name,
      type: input.type,
      parameters,
      fileId: input.fileId,
      status: "PENDING",
    });

    return {
      success: true,
      message: "TRANSFORMATION CREATED",
      transformation,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        transformation: null,
      };
    }

    throw error;
  }
};

export const getTransformationById = async (id: string) => {
  try {
    const transformation = await Transformation.findByPk(id);

    if (!transformation) {
      throw new ApolloError("TRANSFORMATION NOT FOUND");
    }

    return {
      success: true,
      message: "TRANSFORMATION FOUND",
      transformation,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        transformation: null,
      };
    }

    throw error;
  }
};

export const getTransformationsByFile = async (
  input: GetTransformationsInput
): Promise<GetTransformationsResponse> => {
  const { fileId, status, type, page = 1, limit = 10 } = input;
  const offset = (page - 1) * limit;
  const where: any = { fileId };

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  return await Transformation.findAndCountAll({
    where,
    offset,
    limit,
    order: [["createdAt", "DESC"]],
  });
};

export const updateTransformation = async (
  input: UpdateTransformationInput
) => {
  try {
    const { id, name, parameters } = input;

    if (name === undefined && parameters === undefined) {
      throw new ApolloError("NO TRANSFORMATION FIELDS TO UPDATE");
    }

    const transformation = await Transformation.findByPk(id);

    if (!transformation) {
      throw new ApolloError("TRANSFORMATION NOT FOUND");
    }

    if (name !== undefined) {
      transformation.name = name;
    }

    if (parameters !== undefined) {
      if (transformation.type === "STANDARDIZATION") {
        const parsedParameters = standardizationParametersSchema.safeParse(
          parameters
        );
        if (!parsedParameters.success) {
          throw new ApolloError("INVALID STANDARDIZATION PARAMETERS");
        }
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "NORMALIZATION") {
        const parsedParameters = normalizationParametersSchema.safeParse(
          parameters
        );
        if (!parsedParameters.success) {
          throw new ApolloError("INVALID NORMALIZATION PARAMETERS");
        }
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "ONE_HOT_ENCODING") {
        const parsedParameters = oneHotEncodingParametersSchema.safeParse(
          parameters
        );
        if (!parsedParameters.success) {
          throw new ApolloError("INVALID ONE HOT ENCODING PARAMETERS");
        }
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "LOG_TRANSFORM") {
        const parsedParameters = logTransformParametersSchema.safeParse(
          parameters
        );
        if (!parsedParameters.success) {
          throw new ApolloError("INVALID LOG TRANSFORM PARAMETERS");
        }
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "BINNING_COLUMN") {
        const parsedParameters = binningParametersSchema.safeParse(parameters);
        if (!parsedParameters.success) {
          throw new ApolloError("INVALID BINNING PARAMETERS");
        }
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "RECODE_COLUMN") {
        const parsedParameters = recodeParametersSchema.safeParse(parameters);
        if (!parsedParameters.success) {
          throw new ApolloError("INVALID RECODE PARAMETERS");
        }
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "CONCAT_COLUMNS" || transformation.type === "CALCULATE_COLUMN") {
        const isConcat = transformation.type === "CONCAT_COLUMNS";
        const parsedParameters = (isConcat ? concatParametersSchema : calculateParametersSchema).safeParse(parameters);
        if (!parsedParameters.success) throw new ApolloError(isConcat ? "INVALID CONCAT PARAMETERS" : "INVALID CALCULATE PARAMETERS");
        transformation.parameters = { ...parsedParameters.data };
      } else if (transformation.type === "TYPE_CORRECTION") {
        const parsed = typeCorrectionParametersSchema.safeParse(parameters); if (!parsed.success) throw new ApolloError("INVALID TYPE CORRECTION PARAMETERS"); transformation.parameters = { ...parsed.data };
      } else {
        transformation.parameters = { ...parameters };
      }
    }

    await transformation.save();

    return {
      success: true,
      message: "TRANSFORMATION UPDATED",
      transformation,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        transformation: null,
      };
    }

    throw error;
  }
};

export const deleteTransformation = async (id: string) => {
  try {
    const transformation = await Transformation.findByPk(id);

    if (!transformation) {
      throw new ApolloError("TRANSFORMATION NOT FOUND");
    }

    await transformation.destroy();

    return {
      success: true,
      message: "TRANSFORMATION DELETED",
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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "FASTAPI IMPUTATION FAILED";
};

export const previewTransformation = async (transformationId: string) => {
  const transformation = await Transformation.findByPk(transformationId);

  if (!transformation) {
    return {
      success: false,
      message: "TRANSFORMATION NOT FOUND",
      transformation: null,
    };
  }

  if (
    transformation.type !== "IMPUTATION" &&
    transformation.type !== "DEDUPLICATION" &&
    transformation.type !== "OUTLIER_TREATMENT" &&
    transformation.type !== "STANDARDIZATION" &&
    transformation.type !== "NORMALIZATION" &&
    transformation.type !== "ONE_HOT_ENCODING" &&
    transformation.type !== "LOG_TRANSFORM" &&
    transformation.type !== "BINNING_COLUMN" &&
    transformation.type !== "RECODE_COLUMN" &&
    transformation.type !== "CONCAT_COLUMNS" &&
    transformation.type !== "CALCULATE_COLUMN"
    && transformation.type !== "TYPE_CORRECTION"
  ) {
    return {
      success: false,
      message: "TRANSFORMATION TYPE IS NOT EXECUTABLE",
      transformation,
    };
  }

  const file = await File.findByPk(transformation.fileId);

  if (!file) {
    return {
      success: false,
      message: "FILE NOT FOUND",
      transformation,
    };
  }

  if (transformation.type === "OUTLIER_TREATMENT") {
    const parsedParameters = outlierTreatmentParametersSchema.safeParse(
      transformation.parameters
    );

    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = "INVALID OUTLIER TREATMENT PARAMETERS";
      await transformation.save();
      return {
        success: false,
        message: "INVALID OUTLIER TREATMENT PARAMETERS",
        transformation,
        outlierTreatmentResult: null,
      };
    }

    try {
      const parameters = parsedParameters.data as OutlierTreatmentParameters;
      const outlierTreatmentResult = await applyOutlierTreatmentAndCommit(
        file.minioId,
        parameters
      );

      transformation.parameters = { ...parameters };
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();

      return {
        success: true,
        message: "OUTLIER TREATMENT APPLIED",
        transformation,
        outlierTreatmentResult,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();

      return {
        success: false,
        message: errorMessage,
        transformation,
        outlierTreatmentResult: null,
      };
    }
  }

  if (transformation.type === "DEDUPLICATION") {
    const parsedParameters = deduplicationParametersSchema.safeParse(
      transformation.parameters
    );

    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = "INVALID DEDUPLICATION PARAMETERS";
      await transformation.save();
      return {
        success: false,
        message: "INVALID DEDUPLICATION PARAMETERS",
        transformation,
        deduplicationResult: null,
      };
    }

    try {
      const parameters = parsedParameters.data as DeduplicationParameters;
      const { result: deduplicationResult, message } =
        await executeDeduplicationAndCommit(file.minioId, parameters);

      transformation.parameters = { ...parameters };
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();

      return {
        success: true,
        message,
        transformation,
        deduplicationResult,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();

      return {
        success: false,
        message: errorMessage,
        transformation,
        deduplicationResult: null,
      };
    }
  }

  if (transformation.type === "STANDARDIZATION") {
    const parsedParameters = standardizationParametersSchema.safeParse(
      transformation.parameters
    );

    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = "INVALID STANDARDIZATION PARAMETERS";
      await transformation.save();
      return {
        success: false,
        message: "INVALID STANDARDIZATION PARAMETERS",
        transformation,
      };
    }

    try {
      const parameters = parsedParameters.data as StandardizationParameters;
      await postDataToFastApi("preprocessing/standardize", {
        body: {
          file_id: file.minioId,
          columns: parameters.columns,
          method: parameters.method,
          ...(parameters.preview_limit === undefined
            ? {}
            : { preview_limit: parameters.preview_limit }),
        },
      });

      await postDataToFastApi("dataset/apply-preview", {
        body: { dataset_id: file.minioId },
      });

      transformation.parameters = { ...parameters };
      // Set the status to "APPLIED" automatically after successful standardization and applying the preview
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();
      return {
        success: true,
        message: "STANDARDIZATION APPLIED",
        transformation,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();
      return {
        success: false,
        message: errorMessage,
        transformation,
      };
    }
  }

  if (transformation.type === "NORMALIZATION") {
    const parsedParameters = normalizationParametersSchema.safeParse(
      transformation.parameters
    );

    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = "INVALID NORMALIZATION PARAMETERS";
      await transformation.save();
      return {
        success: false,
        message: "INVALID NORMALIZATION PARAMETERS",
        transformation,
      };
    }

    try {
      const parameters = parsedParameters.data as NormalizationParameters;
      await postDataToFastApi("preprocessing/normalize", {
        body: {
          file_id: file.minioId,
          columns: parameters.columns,
          ...(parameters.preview_limit === undefined
            ? {}
            : { preview_limit: parameters.preview_limit }),
        },
      });

      await postDataToFastApi("dataset/apply-preview", {
        body: { dataset_id: file.minioId },
      });

      transformation.parameters = { ...parameters };
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();
      return {
        success: true,
        message: "NORMALIZATION APPLIED",
        transformation,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();
      return {
        success: false,
        message: errorMessage,
        transformation,
      };
    }
  }

  if (transformation.type === "ONE_HOT_ENCODING") {
    const parsedParameters = oneHotEncodingParametersSchema.safeParse(
      transformation.parameters
    );

    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = "INVALID ONE HOT ENCODING PARAMETERS";
      await transformation.save();
      return {
        success: false,
        message: "INVALID ONE HOT ENCODING PARAMETERS",
        transformation,
      };
    }

    try {
      const parameters = parsedParameters.data as OneHotEncodingParameters;
      await postDataToFastApi("preprocessing/one-hot-encode", {
        body: {
          file_id: file.minioId,
          columns: parameters.columns,
          drop_first: parameters.drop_first,
          drop_original: parameters.drop_original,
          ...(parameters.preview_limit === undefined
            ? {}
            : { preview_limit: parameters.preview_limit }),
        },
      });

      await postDataToFastApi("dataset/apply-preview", {
        body: { dataset_id: file.minioId },
      });

      transformation.parameters = { ...parameters };
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();
      return {
        success: true,
        message: "ONE HOT ENCODING APPLIED",
        transformation,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();
      return {
        success: false,
        message: errorMessage,
        transformation,
      };
    }
  }

  if (transformation.type === "LOG_TRANSFORM") {
    const parsedParameters = logTransformParametersSchema.safeParse(
      transformation.parameters
    );
    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = "INVALID LOG TRANSFORM PARAMETERS";
      await transformation.save();
      return {
        success: false,
        message: "INVALID LOG TRANSFORM PARAMETERS",
        transformation,
      };
    }

    try {
      const parameters = parsedParameters.data as LogTransformParameters;
      const logTransformResult = await applyLogTransformAndCommit(
        file.minioId,
        parameters.columns,
        parameters.method,
        parameters.action
      );
      transformation.parameters = { ...parameters };
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();
      return {
        success: true,
        message: "LOG TRANSFORM APPLIED",
        transformation,
        logTransformResult,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();
      return {
        success: false,
        message: errorMessage,
        transformation,
        logTransformResult: null,
      };
    }
  }

  if (
    transformation.type === "BINNING_COLUMN" ||
    transformation.type === "RECODE_COLUMN" ||
    transformation.type === "CONCAT_COLUMNS" ||
    transformation.type === "CALCULATE_COLUMN"
  ) {
    const operation = transformation.type === "BINNING_COLUMN" ? "binning" : transformation.type === "RECODE_COLUMN" ? "recode" : transformation.type === "CONCAT_COLUMNS" ? "concat" : "calculate";
    const schema = operation === "binning" ? binningParametersSchema : operation === "recode" ? recodeParametersSchema : operation === "concat" ? concatParametersSchema : calculateParametersSchema;
    const parsedParameters = schema.safeParse(transformation.parameters);
    const invalidMessage = `INVALID ${operation.toUpperCase()} PARAMETERS`;
    if (!parsedParameters.success) {
      transformation.status = "FAILED";
      transformation.errorMessage = invalidMessage;
      await transformation.save();
      return { success: false, message: invalidMessage, transformation };
    }

    try {
      await executeColumnTransformAndCommit(
        file.minioId,
        operation,
        parsedParameters.data as BinningParameters | RecodeParameters | ConcatParameters | CalculateParameters
      );
      transformation.parameters = { ...parsedParameters.data };
      transformation.status = "APPLIED";
      transformation.errorMessage = null;
      await transformation.save();
      return {
        success: true,
        message: `${operation.toUpperCase()} APPLIED`,
        transformation,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      transformation.status = "FAILED";
      transformation.errorMessage = errorMessage;
      await transformation.save();
      return { success: false, message: errorMessage, transformation };
    }
  }

  if (transformation.type === "TYPE_CORRECTION") {
    const parsed = typeCorrectionParametersSchema.safeParse(transformation.parameters);
    if (!parsed.success) { transformation.status = "FAILED"; transformation.errorMessage = "INVALID TYPE CORRECTION PARAMETERS"; await transformation.save(); return { success: false, message: transformation.errorMessage, transformation, typeCorrectionResult: null }; }
    try { const typeCorrectionResult = await previewTypeCorrection(file.minioId, parsed.data as TypeCorrectionParameters); transformation.parameters = { ...parsed.data }; transformation.status = typeCorrectionResult.requiresConfirmation ? "PREVIEWED" : "APPLIED"; transformation.errorMessage = null; await transformation.save(); return { success: true, message: typeCorrectionResult.requiresConfirmation ? "TYPE CORRECTION REQUIRES CONFIRMATION" : "TYPE CORRECTION APPLIED", transformation, typeCorrectionResult }; }
    catch (error) { const message = getErrorMessage(error); transformation.status = "FAILED"; transformation.errorMessage = message; await transformation.save(); return { success: false, message, transformation, typeCorrectionResult: null }; }
  }

  try {
    await postDataToFastApi("preprocessing/impute", {
      body: {
        file_id: file.minioId,
        method: transformation.parameters.method,
        columns: transformation.parameters.columns,
        n_neighbors: transformation.parameters.n_neighbors,
      },
    });

    transformation.status = "PREVIEWED";
    transformation.errorMessage = null;
    await transformation.save();

    return {
      success: true,
      message: "TRANSFORMATION PREVIEWED",
      transformation,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    transformation.status = "FAILED";
    transformation.errorMessage = errorMessage;
    await transformation.save();

    return {
      success: false,
      message: errorMessage,
      transformation,
    };
  }
};

export const applyTransformation = async (transformationId: string) => {
  const transformation = await Transformation.findByPk(transformationId);

  if (!transformation) {
    return {
      success: false,
      message: "TRANSFORMATION NOT FOUND",
      transformation: null,
    };
  }

  if (transformation.type === "DEDUPLICATION") {
    return {
      success: false,
      message:
        "Deduplication applies automatically and does not support Apply/Cancel.",
      transformation,
    };
  }

  if (transformation.type === "OUTLIER_TREATMENT") {
    return {
      success: false,
      message:
        "Outlier treatment applies automatically and does not support Apply/Cancel.",
      transformation,
    };
  }

  if (
    transformation.type !== "IMPUTATION" &&
    transformation.type !== "STANDARDIZATION" &&
    transformation.type !== "TYPE_CORRECTION"
  ) {
    return {
      success: false,
      message: "TRANSFORMATION TYPE MUST SUPPORT PREVIEW APPLY",
      transformation,
    };
  }

  if (transformation.status !== "PREVIEWED") {
    return {
      success: false,
      message: "TRANSFORMATION STATUS MUST BE PREVIEWED",
      transformation,
    };
  }

  const file = await File.findByPk(transformation.fileId);

  if (!file) {
    return {
      success: false,
      message: "FILE NOT FOUND",
      transformation,
    };
  }

  try {
    await postDataToFastApi("dataset/apply-preview", {
      body: { dataset_id: file.minioId },
    });

    transformation.status = "APPLIED";
    transformation.errorMessage = null;
    await transformation.save();

    return {
      success: true,
      message: "TRANSFORMATION APPLIED",
      transformation,
    };
  } catch (error) {
    const errorMessage = `FASTAPI APPLY FAILED: ${getErrorMessage(error)}`;

    transformation.status = "FAILED";
    transformation.errorMessage = errorMessage;
    await transformation.save();

    return {
      success: false,
      message: errorMessage,
      transformation,
    };
  }
};

export const cancelTransformation = async (transformationId: string) => {
  const transformation = await Transformation.findByPk(transformationId);

  if (!transformation) {
    return {
      success: false,
      message: "TRANSFORMATION NOT FOUND",
      transformation: null,
    };
  }

  if (transformation.type === "DEDUPLICATION") {
    return {
      success: false,
      message:
        "Deduplication applies automatically and does not support Apply/Cancel.",
      transformation,
    };
  }

  if (transformation.type === "OUTLIER_TREATMENT") {
    return {
      success: false,
      message:
        "Outlier treatment applies automatically and does not support Apply/Cancel.",
      transformation,
    };
  }

  if (
    transformation.type !== "IMPUTATION" &&
    transformation.type !== "STANDARDIZATION" &&
    transformation.type !== "TYPE_CORRECTION"
  ) {
    return {
      success: false,
      message: "TRANSFORMATION TYPE MUST SUPPORT PREVIEW CANCEL",
      transformation,
    };
  }

  if (transformation.status !== "PREVIEWED") {
    return {
      success: false,
      message: "TRANSFORMATION STATUS MUST BE PREVIEWED",
      transformation,
    };
  }

  const file = await File.findByPk(transformation.fileId);

  if (!file) {
    return {
      success: false,
      message: "FILE NOT FOUND",
      transformation,
    };
  }

  try {
    await postDataToFastApi("dataset/cancel-preview", {
      body: { dataset_id: file.minioId },
    });

    transformation.status = "CANCELLED";
    transformation.errorMessage = null;
    await transformation.save();

    return {
      success: true,
      message: "TRANSFORMATION CANCELLED",
      transformation,
    };
  } catch (error) {
    const errorMessage = `FASTAPI CANCEL FAILED: ${getErrorMessage(error)}`;

    transformation.status = "FAILED";
    transformation.errorMessage = errorMessage;
    await transformation.save();

    return {
      success: false,
      message: errorMessage,
      transformation,
    };
  }
};

type DatasetStage = "current" | "preview";

type FastApiDatasetData = {
  file_id: string;
  has_preview?: boolean;
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
};

type FastApiDatasetResponse = {
  success: boolean;
  message: string;
  data?: FastApiDatasetData | null;
};

const datasetFailureResponse = (message: string) => ({
  success: false,
  message,
  columns: [],
  rows: 0,
  rowCount: 0,
  data: [],
});

const getFastApiDatasetErrorMessage = (
  response: { status: number; data?: FastApiDatasetResponse },
  stage: DatasetStage
) => {
  const message = response.data?.message?.trim();

  if (
    stage === "preview" &&
    (response.status === 404 || message === "No preview found for this file")
  ) {
    return "PREVIEW NOT FOUND";
  }

  return message || `FASTAPI REQUEST FAILED WITH STATUS ${response.status}`;
};

const getDatasetByStage = async (
  input: GetDatasetInput,
  userId: string | undefined,
  stage: DatasetStage
) => {
  const file = await File.findByPk(input.fileId);

  if (!file) return datasetFailureResponse("FILE NOT FOUND");
  if (!userId) return datasetFailureResponse("ACCESS DENIED");

  try {
    const fastApiToken = await getFastApiToken();
    const { fastApiUrl } = getFastApiConfig();

    if (!fastApiUrl) return datasetFailureResponse("FAST API IS NOT CONFIGURED");

    const response = await axios.get<FastApiDatasetResponse>(
      `${fastApiUrl}/files/${encodeURIComponent(file.minioId)}/${stage}`,
      {
        headers: {
          Authorization: `Bearer ${fastApiToken}`,
          Accept: "application/json",
        },
        params: { preview_limit: input.limit ?? 10 },
        validateStatus: () => true,
      }
    );

    if (
      response.status < 200 ||
      response.status >= 300 ||
      !response.data?.success ||
      !response.data.data
    ) {
      return datasetFailureResponse(getFastApiDatasetErrorMessage(response, stage));
    }

    const dataset = response.data.data;
    return {
      success: true,
      message: response.data.message?.trim() || "DATASET LOADED",
      columns: dataset.columns,
      rows: dataset.rows,
      rowCount: dataset.rows,
      data: dataset.preview,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      return datasetFailureResponse("FASTAPI CONNECTION FAILED");
    }
    const message = error instanceof Error ? error.message.trim() : "";
    return datasetFailureResponse(message || "FASTAPI CONNECTION FAILED");
  }
};

export const getCurrentDataset = async (
  input: GetDatasetInput,
  userId: string | undefined
) => getDatasetByStage(input, userId, "current");

export const getPreviewDataset = async (
  input: GetDatasetInput,
  userId: string | undefined
) => getDatasetByStage(input, userId, "preview");

type ColumnTransformFastApiResponse = {
  success: boolean;
  message: string;
  data?: Record<string, unknown> | null;
};

export const executeColumnTransformAndCommit = async (
  datasetId: string,
  operation: "binning" | "recode" | "concat" | "calculate",
  parameters: BinningParameters | RecodeParameters | ConcatParameters | CalculateParameters
) => {
  const cancelPreview = async () => {
    await postDataToFastApi("dataset/cancel-preview", {
      body: { dataset_id: datasetId },
    });
  };

  try {
    const response = await postDataToFastApi(
      `preprocessing/column/transform/${operation}`,
      { body: { file_id: datasetId, ...parameters } }
    ) as ColumnTransformFastApiResponse;

    await postDataToFastApi("dataset/apply-preview", {
      body: { dataset_id: datasetId },
    });
    return response.data;
  } catch (error) {
    await cancelPreview().catch(() => undefined);
    throw error;
  }
};

type DeduplicationFastApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T | null;
};

type FastApiRecommendationItem = {
  column: string;
  duplicate_rate: number;
  reason: string;
};

type FastApiRecommendationData = {
  recommended: FastApiRecommendationItem[];
  not_advised: FastApiRecommendationItem[];
  low_duplicate: FastApiRecommendationItem[];
};

type FastApiAnalysisData = {
  total_rows: number;
  duplicate_count: number;
  unique_rows: number;
  duplicate_rate: number;
  duplicate_preview: Record<string, unknown>[];
  subset_used: string | string[];
};

type FastApiRemoveData = {
  file_id: string;
  message: string;
  rows_before: number;
  rows_after: number;
  rows_removed: number;
  preview: Record<string, unknown>[];
};

type DeduplicationApplyPreviewData = {
  file_id: string;
  rows: number;
  preview: Record<string, unknown>[];
};

const deduplicationFailure = (message: string) => ({ success: false, message, data: null });

const recommendationItem = (
  item: FastApiRecommendationItem
): DeduplicationRecommendationItem => ({
  column: item.column,
  duplicateRate: item.duplicate_rate,
  reason: item.reason,
});

const resolveTransformationFile = async (fileId: string) => File.findByPk(fileId);

export const getDeduplicationRecommendations = async (
  input: DeduplicationFileInput
) => {
  const file = await resolveTransformationFile(input.fileId);
  if (!file) return deduplicationFailure("FILE NOT FOUND");

  try {
    const response = await getDataFromFastApi("duplicates/recommend", {
      file_id: file.minioId,
    }) as DeduplicationFastApiResponse<FastApiRecommendationData>;

    if (!response.data) {
      return deduplicationFailure(
        response.message || "FASTAPI RECOMMENDATION RETURNED NO DATA"
      );
    }

    const data: DeduplicationRecommendationResult = {
      recommended: response.data.recommended.map(recommendationItem),
      notAdvised: response.data.not_advised.map(recommendationItem),
      lowDuplicate: response.data.low_duplicate.map(recommendationItem),
    };
    return { success: true, message: response.message, data };
  } catch (error) {
    return deduplicationFailure(
      error instanceof Error ? error.message : "FASTAPI RECOMMENDATION FAILED"
    );
  }
};

export const analyzeDeduplication = async (input: AnalyzeDuplicatesInput) => {
  const file = await resolveTransformationFile(input.fileId);
  if (!file) return deduplicationFailure("FILE NOT FOUND");

  try {
    const params: Record<string, string> = { file_id: file.minioId };
    if (input.subset && input.subset.length > 0) {
      params.subset = input.subset.join(",");
    }

    const response = await getDataFromFastApi(
      "duplicates/analyze",
      params
    ) as DeduplicationFastApiResponse<FastApiAnalysisData>;

    if (!response.data) {
      return deduplicationFailure(response.message || "FASTAPI ANALYSIS RETURNED NO DATA");
    }

    const result = response.data;
    const data: DeduplicationAnalysisResult = {
      totalRows: result.total_rows,
      duplicateCount: result.duplicate_count,
      uniqueRows: result.unique_rows,
      duplicateRate: result.duplicate_rate,
      duplicatePreview: result.duplicate_preview,
      subsetUsed: Array.isArray(result.subset_used) ? result.subset_used : [],
    };
    return { success: true, message: response.message, data };
  } catch (error) {
    return deduplicationFailure(
      error instanceof Error ? error.message : "FASTAPI ANALYSIS FAILED"
    );
  }
};

const requireSuccessfulDeduplicationResponse = <T>(
  response: DeduplicationFastApiResponse<T>,
  operation: string
): T => {
  if (!response.success || !response.data) {
    throw new Error(
      response.message || `FASTAPI ${operation.toUpperCase()} RETURNED NO DATA`
    );
  }
  return response.data;
};

export const executeDeduplicationAndCommit = async (
  datasetId: string,
  parameters: DeduplicationParameters
): Promise<{ result: DeduplicationRemoveResult; message: string }> => {
  const subset = parameters.subset ?? [];
  const subsetText = subset.join(",");
  const analysisParams: Record<string, string> = { file_id: datasetId };
  if (subset.length > 0) analysisParams.subset = subsetText;

  const analysisResponse = await getDataFromFastApi(
    "duplicates/analyze",
    analysisParams
  ) as DeduplicationFastApiResponse<FastApiAnalysisData>;
  if (!analysisResponse.data) {
    throw new Error(analysisResponse.message || "FASTAPI ANALYSIS RETURNED NO DATA");
  }

  const removeResponse = await postDataToFastApi("duplicates/remove", {
    body: { file_id: datasetId, subset: subsetText, keep: parameters.keep },
  }) as DeduplicationFastApiResponse<FastApiRemoveData>;
  const removed = requireSuccessfulDeduplicationResponse(
    removeResponse,
    "deduplication removal"
  );

  const applyResponse = await postDataToFastApi("dataset/apply-preview", {
    body: { dataset_id: datasetId },
  }) as DeduplicationFastApiResponse<DeduplicationApplyPreviewData>;
  if (!applyResponse.data) {
    throw new Error(applyResponse.message || "FASTAPI APPLY PREVIEW RETURNED NO DATA");
  }

  return {
    message: removeResponse.message || "DEDUPLICATION APPLIED",
    result: {
      subsetUsed: subset,
      keep: parameters.keep,
      preview: true,
      rowsBefore: removed.rows_before,
      rowsAfter: removed.rows_after,
      rowsRemoved: removed.rows_removed,
      output: "current.csv",
    },
  };
};

type LogTransformFastApiResponse = {
  success: boolean;
  message: string;
  data?: Record<string, any> | null;
};

export const detectLogTransformByDataset = async (
  datasetId: string,
  columns: string[],
  method: LogTransformMethod
): Promise<LogTransformDetectionResult> => {
  const response = await getDataFromFastApi("log-transform/detect", {
    dataset_id: datasetId,
    method,
    columns: columns.join(","),
  }) as LogTransformFastApiResponse;

  const rawResults = response.data?.results ?? {};
  const results = Object.fromEntries(
    Object.entries(rawResults).map(([column, value]: [string, any]) => [
      column,
      {
        method: value.method,
        eligible: value.eligible,
        reason: value.reason,
        min: value.min ?? null,
        skewnessBefore: value.skewness_before ?? null,
        skewnessAfter: value.skewness_after ?? null,
      } as LogTransformColumnResult,
    ])
  );
  return { results };
};

export const analyzeLogTransform = async (input: AnalyzeLogTransformInput) => {
  try {
    const file = await File.findByPk(input.fileId);
    if (!file) return { success: false, message: "FILE NOT FOUND", data: null };
    const data = await detectLogTransformByDataset(
      file.minioId,
      input.columns,
      input.method
    );
    return { success: true, message: "LOG TRANSFORM ANALYZED", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "LOG TRANSFORM ANALYSIS FAILED",
      data: null,
    };
  }
};

export const applyLogTransformAndCommit = async (
  datasetId: string,
  columns: string[],
  method: LogTransformMethod,
  action: LogTransformAction
) => {
  const detection = await detectLogTransformByDataset(datasetId, columns, method);
  const cancelPreview = async () => {
    await postDataToFastApi("dataset/cancel-preview", {
      body: { dataset_id: datasetId },
    });
  };
  const ineligible = columns.filter(
    (column) => !detection.results[column]?.eligible
  );
  if (ineligible.length > 0) {
    const reasons = ineligible
      .map((column) => `${column}: ${detection.results[column]?.reason || "Not eligible"}`)
      .join("; ");
    await cancelPreview().catch(() => undefined);
    throw new Error(`INELIGIBLE LOG TRANSFORM COLUMNS: ${reasons}`);
  }

  try {
    for (const column of columns) {
      const response = await postDataToFastApi("log-transform/apply", {
        body: { dataset_id: datasetId, column, method, action },
      }) as LogTransformFastApiResponse;

      if (!response.success) {
        throw new Error(response.message || "FASTAPI LOG APPLY FAILED");
      }
    }

    await postDataToFastApi("dataset/apply-preview", {
      body: { dataset_id: datasetId },
    });
  } catch (error) {
    await cancelPreview().catch(() => undefined);
    throw error;
  }
  return detection;
};

type OutlierFastApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T | null;
};

type FastApiDetectionData = {
  file_id: string;
  results: Record<string, unknown>;
};

type FastApiTreatmentData = {
  file_id: string;
  message: string;
  outliers_traites: number;
  preview: Record<string, unknown>[];
};

type OutlierApplyPreviewData = {
  file_id: string;
  rows: number;
  preview: Record<string, unknown>[];
};

const outlierFailure = (message: string) => ({ success: false, message, data: null });

export const analyzeOutliers = async (input: AnalyzeOutliersInput) => {
  const file = await File.findByPk(input.fileId);
  if (!file) return outlierFailure("FILE NOT FOUND");

  try {
    const response = await getDataFromFastApi("outliers/detect", {
      dataset_id: file.minioId,
      columns: input.columns.join(","),
      method: input.method,
      factor: input.factor,
    }) as OutlierFastApiResponse<FastApiDetectionData>;

    if (!response.data) {
      return outlierFailure(
        response.message || "FASTAPI OUTLIER DETECTION RETURNED NO DATA"
      );
    }

    const data: OutlierAnalysisResult = { results: response.data.results };
    return { success: true, message: response.message, data };
  } catch (error) {
    return outlierFailure(
      error instanceof Error ? error.message : "FASTAPI OUTLIER DETECTION FAILED"
    );
  }
};

export const applyOutlierTreatmentAndCommit = async (
  datasetId: string,
  parameters: OutlierTreatmentParameters
): Promise<OutlierTreatmentResult> => {
  const treatmentResponse = await postDataToFastApi("outliers/apply", {
    body: {
      dataset_id: datasetId,
      column: parameters.column,
      action: parameters.action,
      method: parameters.method,
      factor: parameters.factor,
    },
  }) as OutlierFastApiResponse<FastApiTreatmentData>;

  if (!treatmentResponse.success || !treatmentResponse.data) {
    throw new Error(
      treatmentResponse.message || "FASTAPI OUTLIER TREATMENT RETURNED NO DATA"
    );
  }

  const applyResponse = await postDataToFastApi("dataset/apply-preview", {
    body: { dataset_id: datasetId },
  }) as OutlierFastApiResponse<OutlierApplyPreviewData>;

  if (!applyResponse.data) {
    throw new Error(
      applyResponse.message || "FASTAPI APPLY PREVIEW RETURNED NO DATA"
    );
  }

  return {
    outliersTreated: treatmentResponse.data.outliers_traites,
    treatmentPreview: treatmentResponse.data.preview,
    rows: applyResponse.data.rows,
    currentPreview: applyResponse.data.preview,
  };
};

type RowOperation = "view" | "sort" | "filter";
type RowOperationApiResponse = {
  success: boolean;
  message?: string;
  detail?: string;
  data?: Record<string, any>;
};

const rowOperationFailure = (message: string) => ({ success: false, message, data: null });

const executeRowOperation = async (
  operation: RowOperation,
  input: RowViewInput | RowSortInput | RowFilterInput,
  userId?: string
) => {
  if (!userId) return rowOperationFailure("ACCESS DENIED");
  const file = await File.findByPk(input.fileId);
  if (!file) return rowOperationFailure("FILE NOT FOUND");
  try {
    const common = {
      file_id: file.minioId,
      page: input.page ?? 1,
      page_size: input.pageSize ?? 20,
    };
    const body = operation === "view"
      ? {
          ...common,
          conditions: (input as RowViewInput).conditions ?? [],
          logic: (input as RowViewInput).logic ?? "AND",
          sort_by: (input as RowViewInput).sortBy ?? [],
        }
      : operation === "filter"
      ? {
          ...common,
          conditions: (input as RowFilterInput).conditions,
          logic: (input as RowFilterInput).logic ?? "AND",
        }
      : { ...common, sort_by: (input as RowSortInput).sortBy };
    const response = await postDataToFastApi(
      `preprocessing/row/${operation}`,
      { body }
    ) as RowOperationApiResponse;

    if (!response.data) {
      throw new Error(
        response.message ||
          response.detail ||
          `FASTAPI ROW ${operation.toUpperCase()} RETURNED NO DATA`
      );
    }

    await postDataToFastApi("dataset/cancel-preview", {
      body: { dataset_id: file.minioId },
    });

    const raw = response.data;
    let rows = (raw.data ?? []) as Record<string, unknown>[];
    let columns = rows.length ? Object.keys(rows[0]) : [];
    if (operation === "view" && (input as RowViewInput).columns?.length) {
      const selected = (input as RowViewInput).columns!;
      const unknown = selected.filter(
        (column) => columns.length > 0 && !columns.includes(column)
      );
      if (unknown.length) {
        return rowOperationFailure(`UNKNOWN COLUMNS: ${unknown.join(", ")}`);
      }
      columns = selected;
      rows = rows.map((row) =>
        Object.fromEntries(selected.map((column) => [column, row[column]]))
      );
    }
    return {
      success: true,
      message: response.message || `ROWS ${operation.toUpperCase()}ED`,
      data: {
        columns,
        rows: raw.rows_after ?? raw.rows_after_filter ?? raw.rows ?? 0,
        rowsBefore: raw.rows_before ?? raw.rows ?? null,
        removedRows: raw.removed_rows ?? null,
        page: raw.page,
        pageSize: raw.page_size,
        totalPages: raw.total_pages,
        logic: raw.logic ?? null,
        conditions: raw.conditions ?? [],
        sortBy: raw.sort_by ?? [],
        data: rows,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      return rowOperationFailure("FASTAPI CONNECTION FAILED");
    }
    return rowOperationFailure(
      error instanceof Error ? error.message : "ROW OPERATION FAILED"
    );
  }
};

export const viewRows = (input: RowViewInput, userId?: string) =>
  executeRowOperation("view", input, userId);
export const sortRows = (input: RowSortInput, userId?: string) =>
  executeRowOperation("sort", input, userId);
export const filterRows = (input: RowFilterInput, userId?: string) =>
  executeRowOperation("filter", input, userId);

type TypeCorrectionApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

const cancelTypeCorrectionPreview = async (
  datasetId: string
): Promise<void> => {
  await postDataToFastApi("dataset/cancel-preview", {
    body: {
      dataset_id: datasetId,
    },
  });
};

const recommendTypeCorrectionDataset = async (
  datasetId: string
): Promise<any> => {
  const response = await getDataFromFastApi(
    "types/recommend",
    {
      dataset_id: datasetId,
    }
  ) as TypeCorrectionApiResponse;

  if (!response.data) {
    throw new Error(
      response.message ||
      "FASTAPI TYPE RECOMMENDATIONS RETURNED NO DATA"
    );
  }

  const recommendations = response.data.recommendations;

  if (recommendations?.error) {
    throw new Error(recommendations.error);
  }

  return recommendations;
};

const mapTypeRecommendationItem = (item: any): TypeRecommendationItem => ({
  column: item.column,
  currentType: item.current_type,
  suggestedType: item.suggested_type ?? null,
  reason: item.reason,
  availableTypes: item.available_types ?? [],
});

export const recommendTypes = async (
  fileId: string,
  userId?: string
) => {
  if (!userId) {
    return {
      success: false,
      message: "ACCESS DENIED",
      data: null,
    };
  }

  const file = await File.findByPk(fileId);

  if (!file) {
    return {
      success: false,
      message: "FILE NOT FOUND",
      data: null,
    };
  }

  try {
    const recommendations = await recommendTypeCorrectionDataset(file.minioId);

    await cancelTypeCorrectionPreview(file.minioId);

    return {
      success: true,
      message: "TYPE RECOMMENDATIONS LOADED",
      data: {
        correct: (recommendations.correct ?? []).map(mapTypeRecommendationItem),
        toCorrect: (recommendations.to_correct ?? []).map(
          mapTypeRecommendationItem
        ),
      },
    };
  } catch (error) {
    await cancelTypeCorrectionPreview(file.minioId).catch(() => undefined);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "TYPE RECOMMENDATIONS FAILED",
      data: null,
    };
  }
};

export const previewTypeCorrection = async (
  datasetId: string,
  parameters: TypeCorrectionParameters
): Promise<TypeCorrectionResult> => {
  try {
    await recommendTypeCorrectionDataset(datasetId);

    const response = await postDataToFastApi("types/apply", {
      body: {
        dataset_id: datasetId,
        column: parameters.column,
        target_type: parameters.target_type,
      },
    }) as TypeCorrectionApiResponse;

    if (!response.success || !response.data) {
      throw new Error(
        response.message ||
        "FASTAPI TYPE CORRECTION RETURNED NO DATA"
      );
    }

    const data = response.data;

    const result: TypeCorrectionResult = {
      column: data.column,
      originalType: data.original_type,
      newType: data.new_type,
      conversionFailures: data.conversion_failures,
      preview: data.preview ?? [],
      requiresConfirmation: data.conversion_failures > 0,
    };

    if (result.requiresConfirmation) {
      return result;
    }

    await postDataToFastApi("dataset/apply-preview", {
      body: {
        dataset_id: datasetId,
      },
    });

    return result;
  } catch (error) {
    await cancelTypeCorrectionPreview(datasetId).catch(() => undefined);
    throw error;
  }
};
