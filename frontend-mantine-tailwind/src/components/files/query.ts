import { gql } from "@apollo/client";

export const GET_FILES_BY_PROJECT = gql`
  query GetFilesByProject($projectId: ID!, $page: Int, $limit: Int) {
    getFilesByProject(projectId: $projectId, page: $page, limit: $limit) {
      rows {
        id
        name
        type
        size
        projectId
        createdAt
      }
      count
      page
      limit
      totalPages
    }
  }
`;
