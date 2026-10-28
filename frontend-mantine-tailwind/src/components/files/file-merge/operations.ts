import { gql } from "@apollo/client";

export const RECOMMEND_FILE_MERGE = gql`
  query RecommendFileMerge($input: RecommendFileMergeInput!) {
    recommendFileMerge(input: $input) {
      success
      message
      data {
        recommendedOperation
        confidenceScore
        reasons
        warnings
        commonColumns
        leftOnlyColumns
        rightOnlyColumns
        typeConflicts {
          column
          leftType
          rightType
        }
        candidateKeys {
          columns
          leftUniqueness
          rightUniqueness
          overlapScore
          duplicateRisk
        }
        operationScores {
          concatVertical
          joinByKey
          upsert
          manualReview
        }
        schemaSimilarity
        leftShape {
          rows
          columns
        }
        rightShape {
          rows
          columns
        }
      }
    }
  }
`;

export const PREVIEW_FILE_MERGE = gql`
  query PreviewFileMerge($input: PreviewFileMergeInput!) {
    previewFileMerge(input: $input) {
      success
      message
      data {
        operation
        columns
        rows
        preview
        warnings
        typeConflicts {
          column
          leftType
          rightType
        }
        statistics {
          leftRows
          rightRows
          resultRows
          matchedLeftRows
          unmatchedLeftRows
          matchedRightRows
          unmatchedRightRows
          updatedRows
          insertedRows
          leftDuplicateKeys
          rightDuplicateKeys
        }
      }
    }
  }
`;

export const EXECUTE_FILE_MERGE = gql`
  mutation ExecuteFileMerge($input: ExecuteFileMergeInput!) {
    executeFileMerge(input: $input) {
      success
      message
      file {
        id
        name
        type
        size
        projectId
        createdAt
      }
      data {
        outputDatasetId
        leftFileId
        rightFileId
        operation
        columns
        rows
        warnings
        createdObjects
        statistics {
          leftRows
          rightRows
          resultRows
          matchedLeftRows
          unmatchedLeftRows
          matchedRightRows
          unmatchedRightRows
          updatedRows
          insertedRows
        }
      }
    }
  }
`;
