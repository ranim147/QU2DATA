import { ApolloError } from "apollo-server-express";
import { Feature, FeatureType } from "./model";
import {
  GetFeaturesOptions,
  GetFeaturesResponse,
  SearchFeatureInput,
  updateFeatureInput,
  FastApiTargetType,
} from "./types";
import axios from "axios";
import { getFastApiConfig } from "../../Helpers/GeneralHelpers";
import { getFastApiToken } from "../../Helpers/ThirdPartFastApiHelper";
import { File } from "../File/model";

const DTYPE_TO_FEATURE_TYPE: Record<string, FeatureType> = {
  int64: "metric",
  int32: "metric",
  float64: "metric",
  float32: "metric",
  bool: "boolean",
  "datetime64[ns]": "time",
  category: "category",
  object: "dimension",
};

const mapDtypeToFeatureType = (dtype: string): FeatureType => {
  return DTYPE_TO_FEATURE_TYPE[dtype] ?? "dimension";
};

export const createFeaturesFromUpload = async (
  fileId: string,
  uploadResult: { columns: string[]; dtypes: Record<string, string> },
  transaction: any
) => {
  const featuresToCreate = uploadResult.columns.map((columnName) => ({
    name: columnName,
    label: null,
    type: mapDtypeToFeatureType(uploadResult.dtypes[columnName]),
    scale: null,
    isVisible: true,
    weight: 1.0,
    fileId,
  }));

  return await Feature.bulkCreate(featuresToCreate, { transaction });
};

export const findFeatureBy = async (input: SearchFeatureInput) => {
  const { param, value } = input;

  const validFields = Object.keys(Feature.getAttributes());
  if (!validFields.includes(param)) {
    throw new Error(`Invalid parameter: ${param}`);
  }

  const whereCondition: Record<string, string | number> = {};
  whereCondition[param] = value;

  return Feature.findOne({ where: whereCondition });
};

export const getFeatures = async (
  args: GetFeaturesOptions
): Promise<GetFeaturesResponse> => {
  try {
    const { page = 1, limit = 10, fileId } = args;
    const offset = (page - 1) * limit;

    const dataRows = await Feature.findAndCountAll({
      where: { fileId },
      offset,
      limit,
      order: [["createdAt", "ASC"]],
    });

    return dataRows;
  } catch (error) {
    console.error("Error fetching features:", error);
    throw error;
  }
};

export const updateFeature = async (input: updateFeatureInput) => {
  const { featureId, ...fields } = input;
  try {
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      throw new ApolloError("FEATURE NOT FOUND");
    }

    Object.keys(fields).forEach((key) => {
      if (fields[key] !== undefined) {
        feature[key] = fields[key];
      }
    });
    await feature.save();

    return { message: "FEATURE UPDATED", feature, success: true };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, feature: null, success: false };
    }
    throw error;
  }
};

export const toggleVisibility = async (featureId: string) => {
  try {
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      throw new ApolloError("FEATURE NOT FOUND");
    }

    feature.isVisible = !feature.isVisible;
    await feature.save();

    return {
      message: feature.isVisible ? "FEATURE VISIBLE" : "FEATURE HIDDEN",
      feature,
      success: true,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, feature: null, success: false };
    }
    throw error;
  }
};

export const deleteFeature = async (featureId: string) => {
  try {
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      throw new ApolloError("FEATURE NOT FOUND");
    }

    await feature.destroy();
    return { success: true, message: "FEATURE DELETED" };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, success: false };
    }
    throw error;
  }
};

// What FastAPI returns for one column's recommendation
interface TypeRecommendation {
  column: string;
  current_type: string;
  suggested_type?: string;
  reason: string;
  available_types: string[];
}

// The full response: columns already correct, and columns to correct
interface TypeRecommendationsResult {
  correct: TypeRecommendation[];
  to_correct: TypeRecommendation[];
}

/**
 * Calls FastAPI to get AI-suggested type corrections for every column
 * of a dataset. Also has a side effect required by FastAPI: it creates
 * the internal "preview" draft, which /types/apply needs later.
 * @param minioId - the dataset id on the FastAPI side
 * @returns the full recommendation list, meant to be shown to the user
 */
const fetchTypeRecommendations = async (
  minioId: string
): Promise<TypeRecommendationsResult> => {
  const { fastApiUrl } = getFastApiConfig();
  const fastApiToken = await getFastApiToken();

  const response = await axios.get(`${fastApiUrl}/types/recommend`, {
    params: { dataset_id: minioId },
    headers: {
      Authorization: `Bearer ${fastApiToken}`,
    },
  });

  // FastAPI wraps its response in { success, message, data }
  return response.data.data.recommendations;
};
// What FastAPI returns after converting one column
interface TypeCorrectionResult {
  column: string;
  original_type: string;
  new_type: string;
  conversion_failures: number;
}

/**
 * Calls FastAPI to actually convert a column to the target type,
 * on the draft dataset (the one created by fetchTypeRecommendations).
 * @param minioId - the dataset id on the FastAPI side
 * @param columnName - the name of the column to convert (matches Feature.name)
 * @param targetType - one of FastAPI's SUPPORTED_TYPES
 *                      ("Int64", "Float64", "String", "Boolean", "Date", "Datetime")
 * @returns conversion details, including how many values failed to convert
 */
const applyTypeConversion = async (
  minioId: string,
  columnName: string,
  targetType: string
): Promise<TypeCorrectionResult> => {
  const { fastApiUrl } = getFastApiConfig();
  const fastApiToken = await getFastApiToken();

  const form = new URLSearchParams();
  form.append("dataset_id", minioId);
  form.append("column", columnName);
  form.append("target_type", targetType);

  const response = await axios.post(`${fastApiUrl}/types/apply`, form, {
    headers: {
      Authorization: `Bearer ${fastApiToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  // FastAPI wraps its response in { success, message, data }
  return response.data.data;
};
/**
 * Calls FastAPI to permanently commit the preview draft into the
 * real working dataset. Without this call, the type conversion
 * done by applyTypeConversion stays temporary and gets discarded.
 * @param minioId - the dataset id on the FastAPI side
 */
const commitPreview = async (minioId: string): Promise<void> => {
  const { fastApiUrl } = getFastApiConfig();
  const fastApiToken = await getFastApiToken();

  const form = new URLSearchParams();
  form.append("dataset_id", minioId);

  await axios.post(`${fastApiUrl}/dataset/apply-preview`, form, {
    headers: {
      Authorization: `Bearer ${fastApiToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};


// Maps FastAPI's type names to our own FeatureType enum
const FASTAPI_TYPE_TO_FEATURE_TYPE: Record<string, FeatureType> = {
  Int64: "metric",
  Float64: "metric",
  Boolean: "boolean",
  Date: "time",
  Datetime: "time",
  String: "dimension",
};

/**
 * Converts a Feature's column to a new data type, end to end:
 * calls FastAPI to actually transform the data, commits the change
 * permanently, then updates our own Feature.type in PostgreSQL.
 * @param featureId - the Feature to convert
 * @param targetType - one of FastAPI's SUPPORTED_TYPES
 */
export const correctFeatureType = async (
  featureId: string,
  targetType: FastApiTargetType
) => {
  try {
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      throw new ApolloError("FEATURE NOT FOUND");
    }

    const file = await File.findByPk(feature.fileId);
    if (!file) {
      throw new ApolloError("FILE NOT FOUND");
    }

    // Step 1 — silently creates the FastAPI "preview" draft
    await fetchTypeRecommendations(file.minioId);

    // Step 2 — actually converts the column on the draft
    const conversionResult = await applyTypeConversion(
      file.minioId,
      feature.name,
      targetType
    );

    // Step 3 — permanently commits the conversion
    await commitPreview(file.minioId);

    // Step 4 — updates our own metadata to reflect the new type
    feature.type = FASTAPI_TYPE_TO_FEATURE_TYPE[targetType] ?? feature.type;
    await feature.save();

    return {
      success: true,
      message: `Column converted from ${conversionResult.original_type} to ${conversionResult.new_type}.`,
      feature,
      conversionFailures: conversionResult.conversion_failures,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        feature: null,
        success: false,
        conversionFailures: null,
      };
    }
    throw error;
  }
};