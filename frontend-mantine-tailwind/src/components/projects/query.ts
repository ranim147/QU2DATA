import { gql } from "@apollo/client";
import { Project } from "../../types/project.types";

export interface ProjectFilterInput {
  name?: string;
  domain?: string;
}

export interface GetProjectsVariables {
  page?: number;
  limit?: number;
  filter?: ProjectFilterInput;
}

interface GetProjectsResponse {
  rows: Project[];
  count: number;
}

export interface GetProjectsType {
  getProjects: GetProjectsResponse;
}

export const GET_PROJECTS_QUERY = gql`
  query GetProjects($page: Int, $limit: Int, $filter: ProjectFilterInput) {
    getProjects(page: $page, limit: $limit, filter: $filter) {
      rows {
        id
        name
        description
        domain
        objective
        createdAt
        updatedAt
      }
      count
    }
  }
`;