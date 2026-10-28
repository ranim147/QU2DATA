import { gql } from "@apollo/client";

export const GET_FILES = gql`
  query GetFilesForTransformations($page: Int, $limit: Int) {
    getFiles(page: $page, limit: $limit) {
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

export const GET_FILE_BY_ID = gql`
  query GetFileByIdForTransformations($fileId: ID!) {
    getFileById(fileId: $fileId) {
      success
      message
      file {
        id
        name
        type
      }
    }
  }
`;

export const GET_TRANSFORMATIONS_BY_FILE = gql`
  query GetTransformationsByFile($fileId: ID!, $page: Int, $limit: Int) {
    getTransformationsByFile(fileId: $fileId, page: $page, limit: $limit) {
      rows {
        id
        name
        type
        parameters
        status
        errorMessage
        fileId
        createdAt
        updatedAt
      }
      count
    }
  }
`;

export const GET_CURRENT_DATASET = gql`
  query GetCurrentDataset($fileId: ID!, $limit: Int) {
    getCurrentDataset(fileId: $fileId, limit: $limit) {
      success
      message
      columns
      rows
      rowCount
      data
    }
  }
`;

export const GET_PREVIEW_DATASET = gql`
  query GetPreviewDataset($fileId: ID!, $limit: Int) {
    getPreviewDataset(fileId: $fileId, limit: $limit) {
      success
      message
      columns
      rows
      rowCount
      data
    }
  }
`;
export const RECOMMEND_TYPES = gql`
  query RecommendTypes($fileId: ID!) {
    recommendTypes(fileId: $fileId) {
      success message
      data { correct { column currentType suggestedType reason availableTypes } toCorrect { column currentType suggestedType reason availableTypes } }
    }
  }
`;

const ROW_RESULT = `success message data { columns rows rowsBefore removedRows page pageSize totalPages logic conditions sortBy data }`;
export const VIEW_ROWS = gql(`query ViewRows($fileId: ID!, $page: Int, $pageSize: Int, $columns: [String!], $conditions: [RowFilterConditionInput!], $logic: String, $sortBy: [RowSortRuleInput!]) { viewRows(fileId: $fileId, page: $page, pageSize: $pageSize, columns: $columns, conditions: $conditions, logic: $logic, sortBy: $sortBy) { ${ROW_RESULT} } }`);
export const SORT_ROWS = gql(`query SortRows($fileId: ID!, $page: Int, $pageSize: Int, $sortBy: [RowSortRuleInput!]!) { sortRows(fileId: $fileId, page: $page, pageSize: $pageSize, sortBy: $sortBy) { ${ROW_RESULT} } }`);
export const FILTER_ROWS = gql(`query FilterRows($fileId: ID!, $page: Int, $pageSize: Int, $conditions: [RowFilterConditionInput!]!, $logic: String) { filterRows(fileId: $fileId, page: $page, pageSize: $pageSize, conditions: $conditions, logic: $logic) { ${ROW_RESULT} } }`);

export const ANALYZE_DUPLICATES = gql`
  query AnalyzeDuplicates($fileId: ID!, $subset: [String!]) {
    analyzeDuplicates(fileId: $fileId, subset: $subset) {
      success
      message
      data {
        totalRows
        duplicateCount
        uniqueRows
        duplicateRate
        duplicatePreview
        subsetUsed
      }
    }
  }
`;

export const GET_DEDUPLICATION_RECOMMENDATIONS = gql`
  query GetDeduplicationRecommendations($fileId: ID!) {
    getDeduplicationRecommendations(fileId: $fileId) {
      success
      message
      data {
        recommended {
          column
          duplicateRate
          reason
        }
        notAdvised {
          column
          duplicateRate
          reason
        }
        lowDuplicate {
          column
          duplicateRate
          reason
        }
      }
    }
  }
`;

export const ANALYZE_OUTLIERS = gql`
  query AnalyzeOutliers(
    $fileId: ID!
    $columns: [String!]!
    $method: OutlierMethod!
    $factor: Float!
  ) {
    analyzeOutliers(
      fileId: $fileId
      columns: $columns
      method: $method
      factor: $factor
    ) {
      success
      message
      data {
        results
      }
    }
  }
`;

export const ANALYZE_LOG_TRANSFORM = gql`
  query AnalyzeLogTransform(
    $fileId: ID!
    $columns: [String!]!
    $method: String!
  ) {
    analyzeLogTransform(fileId: $fileId, columns: $columns, method: $method) {
      success
      message
      data {
        results
      }
    }
  }
`;
