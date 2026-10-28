import { gql } from "apollo-server-express";

const schema = gql`
  type File {
    id: ID!
    name: String
    type: String
    size: Float
    minioId: String
    projectId: ID
    dataSourceId: ID
    createdAt: String
    updatedAt: String
  }

  input FileFilterInput {
    id: ID
    name: String
    type: String
    projectId: ID
  }

  type FileResponse {
    success: Boolean
    message: String
    file: File
  }

  type GetFilesResponse {
    rows: [File]
    count: Int
  }

  type FilesPage {
    rows: [File!]!
    count: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type BasicFileResponse {
    success: Boolean
    message: String
  }

  enum FileMergeOperation {
    CONCAT_VERTICAL
    JOIN_BY_KEY
    UPSERT
  }

  enum FileMergeRecommendedOperation {
    CONCAT_VERTICAL
    JOIN_BY_KEY
    UPSERT
    MANUAL_REVIEW
  }

  enum FileMergeJoinType {
    inner
    left
    outer
  }

  input RecommendFileMergeInput {
    projectId: ID!
    leftFileId: ID!
    rightFileId: ID!
  }

  input PreviewFileMergeInput {
    projectId: ID!
    leftFileId: ID!
    rightFileId: ID!
    operation: FileMergeOperation!
    columnMapping: JSON
    joinKeys: [String!]
    joinType: FileMergeJoinType = left
    addSourceColumn: Boolean = true
    sourceColumnName: String = "_source_file"
    previewLimit: Int = 20
    rightPrecedence: Boolean = true
    updateNonNullOnly: Boolean = true
  }

  input ExecuteFileMergeInput {
    projectId: ID!
    leftFileId: ID!
    rightFileId: ID!
    outputName: String!
    operation: FileMergeOperation!
    columnMapping: JSON
    joinKeys: [String!]
    joinType: FileMergeJoinType = left
    addSourceColumn: Boolean = true
    sourceColumnName: String = "_source_file"
    previewLimit: Int = 20
    rightPrecedence: Boolean = true
    updateNonNullOnly: Boolean = true
  }

  type FileMergeTypeConflict {
    column: String!
    leftType: String!
    rightType: String!
  }

  type FileMergeKeyCandidate {
    columns: [String!]!
    leftUniqueness: Float!
    rightUniqueness: Float!
    overlapScore: Float!
    duplicateRisk: String!
  }

  type FileMergeDatasetShape {
    rows: Int!
    columns: Int!
  }

  type FileMergeOperationScores {
    concatVertical: Float!
    joinByKey: Float!
    upsert: Float!
    manualReview: Float!
  }

  type FileMergeRecommendation {
    recommendedOperation: FileMergeRecommendedOperation!
    confidenceScore: Float!
    reasons: [String!]!
    warnings: [String!]!
    commonColumns: [String!]!
    leftOnlyColumns: [String!]!
    rightOnlyColumns: [String!]!
    typeConflicts: [FileMergeTypeConflict!]!
    candidateKeys: [FileMergeKeyCandidate!]!
    operationScores: FileMergeOperationScores!
    schemaSimilarity: Float!
    leftShape: FileMergeDatasetShape!
    rightShape: FileMergeDatasetShape!
  }

  type FileMergeStatistics {
    leftRows: Int!
    rightRows: Int!
    resultRows: Int!
    matchedLeftRows: Int
    unmatchedLeftRows: Int
    matchedRightRows: Int
    unmatchedRightRows: Int
    updatedRows: Int
    insertedRows: Int
    leftDuplicateKeys: Int
    rightDuplicateKeys: Int
  }

  type FileMergePreview {
    operation: FileMergeOperation!
    columns: [String!]!
    rows: Int!
    preview: [JSON!]!
    warnings: [String!]!
    typeConflicts: [FileMergeTypeConflict!]!
    statistics: FileMergeStatistics!
  }

  type FileMergeExecution {
    outputDatasetId: String!
    leftFileId: ID!
    rightFileId: ID!
    createdObjects: [String!]!
    operation: FileMergeOperation!
    columns: [String!]!
    rows: Int!
    preview: [JSON!]!
    warnings: [String!]!
    typeConflicts: [FileMergeTypeConflict!]!
    statistics: FileMergeStatistics!
  }

  type FileMergeRecommendationResponse {
    success: Boolean!
    message: String!
    data: FileMergeRecommendation
  }

  type FileMergePreviewResponse {
    success: Boolean!
    message: String!
    data: FileMergePreview
  }

  type FileMergeExecutionResponse {
    success: Boolean!
    message: String!
    file: File
    data: FileMergeExecution
  }

  type Query {
    getFiles(
      page: Int = 1
      limit: Int = 10
      filter: FileFilterInput
    ): GetFilesResponse @auth

    getFilesByProject(
      projectId: ID!
      page: Int = 1
      limit: Int = 20
    ): FilesPage! @auth

    getFileById(fileId: ID!): FileResponse

    recommendFileMerge(
      input: RecommendFileMergeInput!
    ): FileMergeRecommendationResponse! @auth

    previewFileMerge(
      input: PreviewFileMergeInput!
    ): FileMergePreviewResponse! @auth
  }

  type Mutation {
    updateFile(
      fileId: ID!
      name: String
    ): FileResponse

    deleteFile(fileId: ID!): BasicFileResponse

    executeFileMerge(
      input: ExecuteFileMergeInput!
    ): FileMergeExecutionResponse! @auth
  }
`;

export default schema;