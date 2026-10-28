import { gql } from "apollo-server-express";

const schema = gql`
  scalar JSON

  enum TransformationStatus {
    PENDING
    PREVIEWED
    APPLIED
    CANCELLED
    FAILED
  }

  enum TransformationType {
    CONCAT_COLUMNS
    CALCULATE_COLUMN
    RECODE_COLUMN
    BINNING_COLUMN
    DEDUPLICATION
    IMPUTATION
    OUTLIER_TREATMENT
    STANDARDIZATION
    NORMALIZATION
    LOG_TRANSFORM
    ONE_HOT_ENCODING
    ROW_FILTER
    TYPE_CORRECTION
  }

  enum OutlierMethod {
    iqr
    zscore
    grubbs
  }

  type Transformation {
    id: ID!
    name: String
    type: TransformationType
    parameters: JSON
    status: TransformationStatus
    errorMessage: String
    fileId: ID
    createdAt: String
    updatedAt: String
  }

  type TransformationResponse {
    success: Boolean
    message: String
    transformation: Transformation
    deduplicationResult: DeduplicationRemoveResult
    outlierTreatmentResult: OutlierTreatmentResult
    logTransformResult: LogTransformDetectionResult
    typeCorrectionResult: TypeCorrectionResult
  }

  type DeduplicationRecommendationItem {
    column: String!
    duplicateRate: Float!
    reason: String!
  }

  type DeduplicationRecommendationResult {
    recommended: [DeduplicationRecommendationItem!]!
    notAdvised: [DeduplicationRecommendationItem!]!
    lowDuplicate: [DeduplicationRecommendationItem!]!
  }

  type DeduplicationRecommendationResponse {
    success: Boolean!
    message: String!
    data: DeduplicationRecommendationResult
  }

  type DeduplicationAnalysisResult {
    totalRows: Int!
    duplicateCount: Int!
    uniqueRows: Int!
    duplicateRate: Float!
    duplicatePreview: [JSON!]!
    subsetUsed: [String!]!
  }

  type DeduplicationAnalysisResponse {
    success: Boolean!
    message: String!
    data: DeduplicationAnalysisResult
  }

  type DeduplicationRemoveResult {
    subsetUsed: [String!]!
    keep: String!
    preview: Boolean!
    rowsBefore: Int!
    rowsAfter: Int!
    rowsRemoved: Int!
    output: String!
  }

  type OutlierAnalysisResult {
    results: JSON!
  }

  type OutlierAnalysisResponse {
    success: Boolean!
    message: String!
    data: OutlierAnalysisResult
  }

  type OutlierTreatmentResult {
    outliersTreated: Int!
    treatmentPreview: [JSON!]!
    rows: Int!
    currentPreview: [JSON!]!
  }

  type LogTransformColumnResult {
    method: String!
    eligible: Boolean!
    reason: String!
    min: Float
    skewnessBefore: Float
    skewnessAfter: Float
  }

  type LogTransformDetectionResult {
    results: JSON!
  }

  type LogTransformDetectionResponse {
    success: Boolean!
    message: String!
    data: LogTransformDetectionResult
  }

  type GetTransformationsResponse {
    rows: [Transformation]
    count: Int
  }

  type BasicTransformationResponse {
    success: Boolean
    message: String
  }

  type DatasetResponse {
    success: Boolean
    message: String
    columns: [String]
    rows: Int
    rowCount: Int
    data: [JSON]
  }

  input RowFilterConditionInput { column: String!, operator: String!, value: JSON }
  input RowSortRuleInput { column: String!, direction: String! }
  type RowOperationResult { columns: [String!]!, rows: Int!, rowsBefore: Int, removedRows: Int, page: Int!, pageSize: Int!, totalPages: Int!, logic: String, conditions: [JSON!]!, sortBy: [JSON!]!, data: [JSON!]! }
  type RowOperationResponse { success: Boolean!, message: String!, data: RowOperationResult }
  type TypeRecommendationItem { column: String!, currentType: String!, suggestedType: String, reason: String!, availableTypes: [String!]! }
  type TypeRecommendations { correct: [TypeRecommendationItem!]!, toCorrect: [TypeRecommendationItem!]! }
  type TypeRecommendationsResponse { success: Boolean!, message: String!, data: TypeRecommendations }
  type TypeCorrectionResult { column: String!, originalType: String!, newType: String!, conversionFailures: Int!, preview: [JSON!]!, requiresConfirmation: Boolean! }

  type Query {
    getTransformationById(id: ID!): TransformationResponse

    getTransformationsByFile(
      fileId: ID!
      status: TransformationStatus
      type: TransformationType
      page: Int = 1
      limit: Int = 10
    ): GetTransformationsResponse

    getCurrentDataset(fileId: ID!, limit: Int = 10): DatasetResponse @auth

    getPreviewDataset(fileId: ID!, limit: Int = 10): DatasetResponse @auth

    getDeduplicationRecommendations(fileId: ID!): DeduplicationRecommendationResponse @auth

    analyzeDuplicates(
      fileId: ID!
      subset: [String!]
    ): DeduplicationAnalysisResponse @auth

    analyzeOutliers(
      fileId: ID!
      columns: [String!]!
      method: OutlierMethod!
      factor: Float!
    ): OutlierAnalysisResponse @auth

    analyzeLogTransform(
      fileId: ID!
      columns: [String!]!
      method: String!
    ): LogTransformDetectionResponse @auth

    viewRows(fileId: ID!, page: Int = 1, pageSize: Int = 20, columns: [String!], conditions: [RowFilterConditionInput!] = [], logic: String = "AND", sortBy: [RowSortRuleInput!] = []): RowOperationResponse @auth
    sortRows(fileId: ID!, page: Int = 1, pageSize: Int = 20, sortBy: [RowSortRuleInput!]!): RowOperationResponse @auth
    filterRows(fileId: ID!, page: Int = 1, pageSize: Int = 20, conditions: [RowFilterConditionInput!]!, logic: String = "AND"): RowOperationResponse @auth
    recommendTypes(fileId: ID!): TypeRecommendationsResponse @auth
  }

  type Mutation {
    createTransformation(
      name: String!
      type: TransformationType!
      parameters: JSON!
      fileId: ID!
    ): TransformationResponse

    updateTransformation(
      id: ID!
      name: String
      parameters: JSON
    ): TransformationResponse

    previewTransformation(transformationId: ID!): TransformationResponse @auth

    applyTransformation(transformationId: ID!): TransformationResponse @auth

    cancelTransformation(transformationId: ID!): TransformationResponse @auth

    deleteTransformation(id: ID!): BasicTransformationResponse
  }
`;

export default schema;
