import { gql } from "@apollo/client";

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface GetFilesVariables {
  filter: { projectId: string };
  page?: number;
  limit?: number;
}

export interface GetFilesType {
  getFiles: {
    rows: ProjectFile[];
    count: number;
  };
}

export const GET_FILES = gql`
  query GetFiles($filter: FileFilterInput, $page: Int, $limit: Int) {
    getFiles(filter: $filter, page: $page, limit: $limit) {
      rows {
        id
        name
        type
        size
        createdAt
      }
      count
    }
  }
`;