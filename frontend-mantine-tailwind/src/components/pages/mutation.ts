import { gql } from "@apollo/client";
import { Page } from "../../types/page.types";

interface PageMutationResponse {
  success: boolean;
  message: string;
  page: Page | null;
}

interface BasicResponse {
  success: boolean;
  message: string;
}

// ─────────────────────────────────────────────
// createPage
// ─────────────────────────────────────────────

export interface CreatePageVariables {
  projectId: string;
  title?: string;
  format?: string;
  width?: number;
  height?: number;
}

export interface CreatePageType {
  createPage: PageMutationResponse;
}

export const CREATE_PAGE_MUTATION = gql`
  mutation CreatePage(
    $projectId: ID!
    $title: String
    $format: PageFormat
    $width: Int
    $height: Int
  ) {
    createPage(
      projectId: $projectId
      title: $title
      format: $format
      width: $width
      height: $height
    ) {
      success
      message
      page {
        id
        title
        format
        width
        height
        orderIndex
        projectId
      }
    }
  }
`;

// ─────────────────────────────────────────────
// updatePage — rename, reorder, resize
// ─────────────────────────────────────────────

export interface UpdatePageVariables {
  pageId: string;
  title?: string;
  format?: string;
  width?: number;
  height?: number;
  orderIndex?: number;
}

export interface UpdatePageType {
  updatePage: PageMutationResponse;
}

export const UPDATE_PAGE_MUTATION = gql`
  mutation UpdatePage(
    $pageId: ID!
    $title: String
    $format: PageFormat
    $width: Int
    $height: Int
    $orderIndex: Int
  ) {
    updatePage(
      pageId: $pageId
      title: $title
      format: $format
      width: $width
      height: $height
      orderIndex: $orderIndex
    ) {
      success
      message
      page {
        id
        title
        format
        width
        height
        orderIndex
      }
    }
  }
`;

// ─────────────────────────────────────────────
// deletePage
// ─────────────────────────────────────────────

export interface DeletePageVariables {
  pageId: string;
}

export interface DeletePageType {
  deletePage: BasicResponse;
}

export const DELETE_PAGE_MUTATION = gql`
  mutation DeletePage($pageId: ID!) {
    deletePage(pageId: $pageId) {
      success
      message
    }
  }
`;