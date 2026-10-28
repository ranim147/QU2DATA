import { ProjectFile } from "../types";

export type FileMergeOperation =
  | "CONCAT_VERTICAL"
  | "JOIN_BY_KEY"
  | "UPSERT";

export type RecommendedFileMergeOperation =
  | FileMergeOperation
  | "MANUAL_REVIEW";

export type FileMergeJoinType = "inner" | "left" | "outer";

export interface FileMergeTypeConflict {
  column: string;
  leftType: string;
  rightType: string;
}

export interface FileMergeKeyCandidate {
  columns: string[];
  leftUniqueness: number;
  rightUniqueness: number;
  overlapScore: number;
  duplicateRisk: string;
}

export interface FileMergeStatistics {
  leftRows: number;
  rightRows: number;
  resultRows: number;
  matchedLeftRows?: number | null;
  unmatchedLeftRows?: number | null;
  matchedRightRows?: number | null;
  unmatchedRightRows?: number | null;
  updatedRows?: number | null;
  insertedRows?: number | null;
  leftDuplicateKeys?: number | null;
  rightDuplicateKeys?: number | null;
}

export interface FileMergeRecommendation {
  recommendedOperation: RecommendedFileMergeOperation;
  confidenceScore: number;
  reasons: string[];
  warnings: string[];
  commonColumns: string[];
  leftOnlyColumns: string[];
  rightOnlyColumns: string[];
  typeConflicts: FileMergeTypeConflict[];
  candidateKeys: FileMergeKeyCandidate[];
  operationScores: {
    concatVertical: number;
    joinByKey: number;
    upsert: number;
    manualReview: number;
  };
  schemaSimilarity: number;
  leftShape: { rows: number; columns: number };
  rightShape: { rows: number; columns: number };
}

export interface FileMergePreview {
  operation: FileMergeOperation;
  columns: string[];
  rows: number;
  preview: Record<string, unknown>[];
  warnings: string[];
  typeConflicts: FileMergeTypeConflict[];
  statistics: FileMergeStatistics;
}

export interface MergeConfiguration {
  operation: FileMergeOperation | null;
  columnMapping: Record<string, string>;
  joinKeys: string[];
  joinType: FileMergeJoinType;
  addSourceColumn: boolean;
  sourceColumnName: string;
  previewLimit: number;
  rightPrecedence: boolean;
  updateNonNullOnly: boolean;
}

export interface RecommendFileMergeData {
  recommendFileMerge: {
    success: boolean;
    message: string;
    data: FileMergeRecommendation | null;
  };
}

export interface PreviewFileMergeData {
  previewFileMerge: {
    success: boolean;
    message: string;
    data: FileMergePreview | null;
  };
}

export interface ExecuteFileMergeData {
  executeFileMerge: {
    success: boolean;
    message: string;
    file: ProjectFile | null;
    data: {
      outputDatasetId: string;
      leftFileId: string;
      rightFileId: string;
      operation: FileMergeOperation;
      columns: string[];
      rows: number;
      warnings: string[];
      createdObjects: string[];
      statistics: FileMergeStatistics;
    } | null;
  };
}
