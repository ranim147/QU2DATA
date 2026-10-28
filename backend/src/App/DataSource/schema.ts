import { gql } from "apollo-server-express";

export default gql`
  scalar JSON

  type StandardColumn {
    name: String!
    type: String!
  }

  type StandardDataset {
    columns: [StandardColumn!]!
    rows: JSON!
    metadata: JSON!
  }

  type CsvSnapshotResult {
    fileName: String!
    filePath: String!
    mimeType: String!
    sizeBytes: Float!
    rowCount: Int!
    columnCount: Int!
  }

  type DataSource {
    id: ID!
    projectId: ID!
    name: String!
    type: String!
    host: String!
    port: Int!
    databaseName: String!
    username: String
    options: JSON
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  input TestDataSourceConnectionInput {
    type: String!
    host: String!
    port: Int!
    databaseName: String!
    username: String
    password: String
    options: JSON
  }
  input DataSourceResourceInput {
    resourceName: String!
    alias: String
  }

  input DataSourceJoinInput {
    type: String!

    leftAlias: String!
    leftColumn: String!

    rightAlias: String!
    rightColumn: String!
  }

  input CreateDataSourceInput {
    projectId: ID!
    name: String!
    type: String!
    host: String!
    port: Int!
    databaseName: String!
    username: String
    password: String
    options: JSON
  }

  input ExtractDataSourceInput {
    dataSourceId: ID!
    resources: [DataSourceResourceInput!]!
    joins: [DataSourceJoinInput!]
    maxRows: Int
  }

  type Query {
    dataSourceHealth: String!

    dataSources: [DataSource!]!

    dataSource(id: ID!): DataSource!

    dataSourceResourcesById(
      dataSourceId: ID!
    ): [String!]!

    previewDataSourceById(
      dataSourceId: ID!
      resourceName: String!
      limit: Int
    ): StandardDataset!
  }

  type Mutation {
    createDataSource(
      input: CreateDataSourceInput!
    ): DataSource!

    testDataSourceConnection(
      input: TestDataSourceConnectionInput!
    ): Boolean!

    testSavedDataSourceConnection(
      dataSourceId: ID!
    ): Boolean!

    extractDataSource(
      input: ExtractDataSourceInput!
    ): File!
  }
`;
