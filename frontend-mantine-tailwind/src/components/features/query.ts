import { gql } from "@apollo/client";
import { Feature } from "../../types/feature.types";

export interface GetFeaturesVariables {
  fileId: string;
  page?: number;
  limit?: number;
}

interface GetFeaturesResponse {
  rows: Feature[];
  count: number;
}

export interface GetFeaturesType {
  getFeatures: GetFeaturesResponse;
}

export const GET_FEATURES_QUERY = gql`
  query GetFeatures($fileId: ID!, $page: Int, $limit: Int) {
    getFeatures(fileId: $fileId, page: $page, limit: $limit) {
      rows {
        id
        name
        label
        type
        scale
        isVisible
        weight
        fileId
        createdAt
        updatedAt
      }
      count
    }
  }
`;