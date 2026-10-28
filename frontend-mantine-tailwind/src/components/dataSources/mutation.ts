import { gql } from "@apollo/client";
import { CreateDataSourceInput, DataSource, DataSourceConnectionInput } from "./types";

export interface TestConnectionData {
  testDataSourceConnection: boolean;
}

export interface TestConnectionVariables {
  input: DataSourceConnectionInput;
}

export interface CreateDataSourceData {
  createDataSource: DataSource;
}

export interface CreateDataSourceVariables {
  input: CreateDataSourceInput;
}

export interface TestSavedDataSourceData {
  testSavedDataSourceConnection: boolean;
}

export interface TestSavedDataSourceVariables {
  dataSourceId: string;
}

export interface ExtractDataSourceData {
  extractDataSource: {
    id: string;
    name: string | null;
    type: string | null;
    size: number | null;
    projectId: string | null;
    dataSourceId: string | null;
  };
}

export interface ExtractDataSourceVariables {
  input: {
    dataSourceId: string;
    resources: Array<{ resourceName: string }>;
    maxRows?: number;
  };
}

export const TEST_DATA_SOURCE_CONNECTION = gql`
  mutation TestDataSourceConnection($input: TestDataSourceConnectionInput!) {
    testDataSourceConnection(input: $input)
  }
`;

export const CREATE_DATA_SOURCE = gql`
  mutation CreateDataSource($input: CreateDataSourceInput!) {
    createDataSource(input: $input) {
      id
      projectId
      name
      type
      host
      port
      databaseName
      username
      status
      createdAt
      updatedAt
    }
  }
`;

export const TEST_SAVED_DATA_SOURCE = gql`
  mutation TestSavedDataSource($dataSourceId: ID!) {
    testSavedDataSourceConnection(dataSourceId: $dataSourceId)
  }
`;

export const EXTRACT_DATA_SOURCE = gql`
  mutation ExtractDataSource($input: ExtractDataSourceInput!) {
    extractDataSource(input: $input) {
      id
      name
      type
      size
      projectId
      dataSourceId
    }
  }
`;
