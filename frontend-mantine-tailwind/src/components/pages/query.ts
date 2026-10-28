import { gql } from "@apollo/client";
import { Page } from "../../types/page.types";

export interface GetPagesVariables {
  projectId: string;
}

export interface GetPagesType {
  getPages: Page[];
}

export const GET_PAGES_QUERY = gql`
  query GetPages($projectId: ID!) {
    getPages(projectId: $projectId) {
      id
      title
      format
      width
      height
      orderIndex
      projectId
      createdAt
      updatedAt
    }
  }
`;