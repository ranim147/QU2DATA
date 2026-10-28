import { gql } from "apollo-server-express";

const schema = gql`
  scalar JSON

  enum SamplingSizeMode {
    n
    percent
  }

  enum SystematicSamplingSizeMode {
    n
    percent
    k
  }

  enum StratifiedSamplingMode {
    proportionnel
    equilibre
  }

  input SimpleRandomSamplingInput {
    fileId: ID!
    size: Float!
    sizeMode: SamplingSizeMode = n
    seed: Int = 42
    confidence: Int = 95
  }

  type SimpleRandomSamplingResult {
    fileId: ID!
    source: String
    output: String
    hasPreview: Boolean
    method: String!
    totalRows: Int!
    sampleSize: Int!
    sizeMode: String!
    sizeValue: Float!
    seed: Int!
    confidence: Int!
    selectedIndices: [Int!]!
    rows: Int!
    columns: [String!]!
    preview: JSON!
    data: JSON!
  }

  type SimpleRandomSamplingResponse {
    success: Boolean!
    message: String
    data: SimpleRandomSamplingResult
  }

  input SystematicSamplingInput {
    fileId: ID!
    size: Float!
    sizeMode: SystematicSamplingSizeMode = n
    seed: Int = 42
    confidence: Int = 95
  }

  type SystematicSamplingResult {
    fileId: ID!
    source: String
    output: String
    hasPreview: Boolean
    method: String!
    totalRows: Int!
    sampleSize: Int!
    sizeMode: String!
    sizeValue: Float!
    seed: Int!
    confidence: Int!
    k: Int
    offset: Int
    selectedIndices: [Int!]!
    rows: Int!
    columns: [String!]!
    preview: JSON!
    data: JSON!
  }

  type SystematicSamplingResponse {
    success: Boolean!
    message: String
    data: SystematicSamplingResult
  }

  input BootstrapSamplingInput {
    fileId: ID!
    sampleSize: Int!
  }

  type BootstrapSamplingResult {
    fileId: ID!
    message: String!
    rowsOriginal: Int!
    rowsSampled: Int!
    marginOfError: Float!
    confidenceLevel: Float!
    preview: JSON!
  }

  type BootstrapSamplingResponse {
    success: Boolean!
    message: String
    data: BootstrapSamplingResult
  }

  input StratifiedSamplingInput {
    fileId: ID!
    strateColumn: String!
    sampleSize: Int
    mode: StratifiedSamplingMode = proportionnel
  }

  type StratifiedSamplingResult {
    fileId: ID!
    message: String!
    strateColumn: String!
    modalities: JSON!
    rowsOriginal: Int!
    rowsSampled: Int!
    marginOfError: Float!
    confidenceLevel: Float!
    preview: JSON!
  }

  type StratifiedSamplingResponse {
    success: Boolean!
    message: String
    data: StratifiedSamplingResult
  }

  input QuotaCellInput {
    values: JSON!
    target: Int!
  }

  input QuotaSamplingInput {
    fileId: ID!
    quotaColumns: [String!]!
    quotas: [QuotaCellInput!]!
    seed: Int = 42
    confidence: Int = 95
    allowUnderfilled: Boolean = false
  }

  type QuotaResult {
    values: JSON!
    requested: Int!
    available: Int!
    selected: Int!
    underfilled: Boolean!
  }

  type QuotaSamplingResult {
    fileId: ID!
    source: String
    output: String
    hasPreview: Boolean
    method: String!
    totalRows: Int!
    sampleSize: Int!
    seed: Int!
    confidence: Int!
    quotaColumns: [String!]!
    quotaResults: [QuotaResult!]!
    selectedIndices: [Int!]!
    rows: Int!
    columns: [String!]!
    preview: JSON!
    data: JSON!
  }

  type QuotaSamplingResponse {
    success: Boolean!
    message: String
    data: QuotaSamplingResult
  }

  type Sample {
    id: ID!
    name: String
    methodName: String
    size: Int
    fileId: ID
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  type SampleResponse {
    success: Boolean
    message: String
    sample: Sample
  }

  type GetSamplesResponse {
    rows: [Sample]
    count: Int
  }

  type BasicSampleResponse {
    success: Boolean
    message: String
  }

  type Query {
    getSamples: GetSamplesResponse
    getSampleById(sampleId: ID!): SampleResponse
    getSamplesByFileId(fileId: ID!): GetSamplesResponse
  }

  type Mutation {
    executeSimpleRandomSampling(
      input: SimpleRandomSamplingInput!
    ): SimpleRandomSamplingResponse! @auth

    executeSystematicSampling(
      input: SystematicSamplingInput!
    ): SystematicSamplingResponse! @auth

    executeBootstrapSampling(
      input: BootstrapSamplingInput!
    ): BootstrapSamplingResponse! @auth

    executeStratifiedSampling(
      input: StratifiedSamplingInput!
    ): StratifiedSamplingResponse! @auth

    executeQuotaSampling(
      input: QuotaSamplingInput!
    ): QuotaSamplingResponse! @auth

    createSample(
      name: String!
      methodName: String!
      size: Int!
      fileId: ID!
      isActive: Boolean
    ): SampleResponse

    updateSample(
      sampleId: ID!
      name: String
      methodName: String
      size: Int
      fileId: ID
      isActive: Boolean
    ): SampleResponse

    deleteSample(sampleId: ID!): BasicSampleResponse
  }
`;

export default schema;
