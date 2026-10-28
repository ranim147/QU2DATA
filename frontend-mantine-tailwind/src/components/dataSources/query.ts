import { gql } from "@apollo/client";
import { DataSource } from "./types";

export interface GetDataSourcesData {
  dataSources: DataSource[];
}

export interface GetDataSourceResourcesData {
  dataSourceResourcesById: string[];
}

export interface GetDataSourceResourcesVariables {
  dataSourceId: string;
}

export const GET_DATA_SOURCES = gql`
  query GetDataSources {
    dataSources {
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

export const GET_DATA_SOURCE_RESOURCES = gql`
  query GetDataSourceResources($dataSourceId: ID!) {
    dataSourceResourcesById(dataSourceId: $dataSourceId)
  }
`;
