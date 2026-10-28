import { gql } from "apollo-server-express";

const schema = gql`
  enum FeatureType {
    metric
    dimension
    time
    text
    boolean
    category
  }

  enum FeatureScale {
    nominal
    ordinal
    interval
    ratio
  }

  enum FastApiTargetType {
    Int64
    Float64
    String
    Boolean
    Date
    Datetime
  }

  type Feature {
    id: ID!
    name: String
    label: String
    type: FeatureType
    scale: FeatureScale
    isVisible: Boolean
    weight: Float
    fileId: ID
    createdAt: String
    updatedAt: String
  }

  type Mutation {
    updateFeature(
      featureId: ID!
      label: String
      type: FeatureType
      scale: FeatureScale
      isVisible: Boolean
      weight: Float
    ): FeatureResponse! @auth

    toggleFeatureVisibility(featureId: ID!): FeatureResponse! @auth

    deleteFeature(featureId: ID!): BasicResponse! @auth

    correctFeatureType(
      featureId: ID!
      targetType: FastApiTargetType!
    ): FeatureCorrectionResponse! @auth
  }

  type Query {
    getFeatures(
      fileId: ID!
      page: Int = 1
      limit: Int = 10
    ): GetFeaturesResponse! @auth
  }

  type FeatureResponse {
    message: String
    feature: Feature
    success: Boolean
  }

  type FeatureCorrectionResponse {
    message: String
    feature: Feature
    success: Boolean
    conversionFailures: Int
  }

  type GetFeaturesResponse {
    rows: [Feature]
    count: Int
  }
`;

export default schema;