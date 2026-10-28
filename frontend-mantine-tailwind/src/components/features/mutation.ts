import { gql } from "@apollo/client";
import { Feature, FeatureScale, FeatureType } from "../../types/feature.types";

interface FeatureMutationResponse {
  success: boolean;
  message: string;
  feature: Feature | null;
}

interface BasicResponse {
  success: boolean;
  message: string;
}

// ─────────────────────────────────────────────
// updateFeature — label, type, scale, isVisible, weight
// ─────────────────────────────────────────────

export interface UpdateFeatureVariables {
  featureId: string;
  label?: string;
  type?: FeatureType;
  scale?: FeatureScale;
  isVisible?: boolean;
  weight?: number;
}

export interface UpdateFeatureType {
  updateFeature: FeatureMutationResponse;
}

export const UPDATE_FEATURE_MUTATION = gql`
  mutation UpdateFeature(
    $featureId: ID!
    $label: String
    $type: FeatureType
    $scale: FeatureScale
    $isVisible: Boolean
    $weight: Float
  ) {
    updateFeature(
      featureId: $featureId
      label: $label
      type: $type
      scale: $scale
      isVisible: $isVisible
      weight: $weight
    ) {
      success
      message
      feature {
        id
        name
        label
        type
        scale
        isVisible
        weight
        updatedAt
      }
    }
  }
`;

// ─────────────────────────────────────────────
// toggleFeatureVisibility
// ─────────────────────────────────────────────

export interface ToggleFeatureVisibilityVariables {
  featureId: string;
}

export interface ToggleFeatureVisibilityType {
  toggleFeatureVisibility: FeatureMutationResponse;
}

export const TOGGLE_FEATURE_VISIBILITY_MUTATION = gql`
  mutation ToggleFeatureVisibility($featureId: ID!) {
    toggleFeatureVisibility(featureId: $featureId) {
      success
      message
      feature {
        id
        isVisible
      }
    }
  }
`;

// ─────────────────────────────────────────────
// deleteFeature
// ─────────────────────────────────────────────

export interface DeleteFeatureVariables {
  featureId: string;
}

export interface DeleteFeatureType {
  deleteFeature: BasicResponse;
}

export const DELETE_FEATURE_MUTATION = gql`
  mutation DeleteFeature($featureId: ID!) {
    deleteFeature(featureId: $featureId) {
      success
      message
    }
  }
`;