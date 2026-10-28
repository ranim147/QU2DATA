import { FeatureInstance } from "./model/feature.model";
import { FeatureType, FeatureScale } from "./model/feature.model";

export interface updateFeatureInput {
  featureId: string;
  label?: string;
  type?: FeatureType;
  scale?: FeatureScale;
  isVisible?: boolean;
  weight?: number;
}

export interface SearchFeatureInput {
  param: string;
  value: string | number;
}

export interface GetFeaturesOptions {
  page?: number;
  limit?: number;
  fileId: string;
}

export interface GetFeaturesResponse {
  rows: FeatureInstance[];
  count: number;
}
export type FastApiTargetType =
  | "Int64"
  | "Float64"
  | "String"
  | "Boolean"
  | "Date"
  | "Datetime";

export interface correctFeatureTypeInput {
  featureId: string;
  targetType: FastApiTargetType;
}