import { Request, Response } from "express";
import { FileInstance } from "./model/file.model";

export interface CreateFileInput {
  req: Request
}

export interface UpdateFileInput {
  fileId: string;
  name?: string;
}

export interface DeleteFileInput {
  fileId: string;
}

export interface GetFileByIdInput {
  fileId: string;
}

export interface GetFilesOptions {
  page?: number;
  limit?: number;
  filter: {
    id?: string;
    name?: string;
    type?: string;
    projectId: string;
  };
}

export interface GetFilesResponse {
  rows: FileInstance[];
  count: number;
}

export interface GetFilesByProjectInput {
  projectId: string;
  page?: number;
  limit?: number;
}

export interface FilesPage extends GetFilesResponse {
  page: number;
  limit: number;
  totalPages: number;
}

export type FileMergeOperation =
  | "CONCAT_VERTICAL"
  | "JOIN_BY_KEY"
  | "UPSERT";

export type FileMergeRecommendedOperation =
  | FileMergeOperation
  | "MANUAL_REVIEW";

export type FileMergeJoinType = "inner" | "left" | "outer";

export interface RecommendFileMergeInput {
  projectId: string;
  leftFileId: string;
  rightFileId: string;
}

export interface PreviewFileMergeInput extends RecommendFileMergeInput {
  operation: FileMergeOperation;
  columnMapping: Record<string, string>;
  joinKeys: string[];
  joinType: FileMergeJoinType;
  addSourceColumn: boolean;
  sourceColumnName: string;
  previewLimit: number;
  rightPrecedence: boolean;
  updateNonNullOnly: boolean;
}

export interface ExecuteFileMergeInput extends PreviewFileMergeInput {
  outputName: string;
}

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

export interface FileMergeDatasetShape {
  rows: number;
  columns: number;
}

export interface FileMergeOperationScores {
  concatVertical: number;
  joinByKey: number;
  upsert: number;
  manualReview: number;
}

export interface FileMergeRecommendation {
  recommendedOperation: FileMergeRecommendedOperation;
  confidenceScore: number;
  reasons: string[];
  warnings: string[];
  commonColumns: string[];
  leftOnlyColumns: string[];
  rightOnlyColumns: string[];
  typeConflicts: FileMergeTypeConflict[];
  candidateKeys: FileMergeKeyCandidate[];
  operationScores: FileMergeOperationScores;
  schemaSimilarity: number;
  leftShape: FileMergeDatasetShape;
  rightShape: FileMergeDatasetShape;
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

export interface FileMergePreview {
  operation: FileMergeOperation;
  columns: string[];
  rows: number;
  preview: Record<string, unknown>[];
  warnings: string[];
  typeConflicts: FileMergeTypeConflict[];
  statistics: FileMergeStatistics;
}

export interface FileMergeExecution extends FileMergePreview {
  outputDatasetId: string;
  leftFileId: string;
  rightFileId: string;
  createdObjects: string[];
}
