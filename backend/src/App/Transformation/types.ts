import type {
  TransformationInstance,
  TransformationStatus,
} from "./model/transformation.model";

export type { TransformationStatus };

export const TRANSFORMATION_TYPES = [
  "CONCAT_COLUMNS",
  "CALCULATE_COLUMN",
  "RECODE_COLUMN",
  "BINNING_COLUMN",
  "DEDUPLICATION",
  "IMPUTATION",
  "OUTLIER_TREATMENT",
  "STANDARDIZATION",
  "NORMALIZATION",
  "LOG_TRANSFORM",
  "ONE_HOT_ENCODING",
  "ROW_FILTER",
  "TYPE_CORRECTION",
] as const;

export type TransformationType = (typeof TRANSFORMATION_TYPES)[number];

export interface CreateTransformationInput {
  name: string;
  type: TransformationType;
  parameters: Record<string, unknown>;
  fileId: string;
}

export interface UpdateTransformationInput {
  id: string;
  name?: string;
  parameters?: Record<string, unknown>;
}

export interface PreviewTransformationInput {
  transformationId: string;
}

export interface ApplyTransformationInput {
  transformationId: string;
}

export interface CancelTransformationInput {
  transformationId: string;
}

export interface GetDatasetInput {
  fileId: string;
  limit?: number;
}

export type RowFilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "between" | "contains" | "not_contains" | "starts_with" | "ends_with" | "in" | "is_null" | "is_not_null";
export type RowLogic = "AND" | "OR";
export interface RowFilterCondition { column: string; operator: RowFilterOperator; value?: unknown; }
export interface RowSortRule { column: string; direction: "asc" | "desc"; }
export interface RowViewInput { fileId: string; page?: number; pageSize?: number; columns?: string[]; conditions?: RowFilterCondition[]; logic?: RowLogic; sortBy?: RowSortRule[]; }
export interface RowFilterInput { fileId: string; page?: number; pageSize?: number; conditions: RowFilterCondition[]; logic?: RowLogic; }
export interface RowSortInput { fileId: string; page?: number; pageSize?: number; sortBy: RowSortRule[]; }

export interface DeduplicationParameters {
  subset?: string[];
  keep: "first" | "last";
  preview: true;
}

export interface DeduplicationFileInput {
  fileId: string;
}

export interface AnalyzeDuplicatesInput extends DeduplicationFileInput {
  subset?: string[];
}

export interface DeduplicationRecommendationItem {
  column: string;
  duplicateRate: number;
  reason: string;
}

export interface DeduplicationRecommendationResult {
  recommended: DeduplicationRecommendationItem[];
  notAdvised: DeduplicationRecommendationItem[];
  lowDuplicate: DeduplicationRecommendationItem[];
}

export interface DeduplicationAnalysisResult {
  totalRows: number;
  duplicateCount: number;
  uniqueRows: number;
  duplicateRate: number;
  duplicatePreview: Record<string, unknown>[];
  subsetUsed: string[];
}

export interface DeduplicationRemoveResult {
  subsetUsed: string[];
  keep: "first" | "last";
  preview: true;
  rowsBefore: number;
  rowsAfter: number;
  rowsRemoved: number;
  output: string;
}

export type OutlierMethod = "iqr" | "zscore" | "grubbs";
export type OutlierAction =
  | "delete"
  | "replace_median"
  | "replace_mean"
  | "mark"
  | "ignore";

export interface OutlierTreatmentParameters {
  column: string;
  method: OutlierMethod;
  action: OutlierAction;
  factor: number;
  preview: true;
}

export interface AnalyzeOutliersInput {
  fileId: string;
  columns: string[];
  method: OutlierMethod;
  factor: number;
}

export interface OutlierAnalysisResult {
  results: Record<string, unknown>;
}

export interface OutlierTreatmentResult {
  outliersTreated: number;
  treatmentPreview: Record<string, unknown>[];
  rows: number;
  currentPreview: Record<string, unknown>[];
}

export type StandardizationMethod = "z_score" | "min_max" | "robust";

export interface StandardizationParameters {
  columns: string[];
  method: StandardizationMethod;
  preview_limit?: number;
}

export interface NormalizationParameters {
  columns: string[];
  preview_limit?: number;
}

export interface OneHotEncodingParameters {
  columns: string[];
  drop_first?: boolean;
  drop_original?: boolean;
  preview_limit?: number;
}

export type LogTransformMethod = "log1p" | "log";
export type LogTransformAction = "replace" | "new_column" | "ignore";

export interface LogTransformParameters {
  columns: string[];
  method: LogTransformMethod;
  action: LogTransformAction;
}

export interface LogTransformColumnResult {
  method: LogTransformMethod;
  eligible: boolean;
  reason: string;
  min?: number | null;
  skewnessBefore?: number | null;
  skewnessAfter?: number | null;
}

export interface LogTransformDetectionResult {
  results: Record<string, LogTransformColumnResult>;
}

export interface AnalyzeLogTransformInput {
  fileId: string;
  columns: string[];
  method: LogTransformMethod;
}

export interface BinningRule {
  label: string;
  min: number;
  max: number;
}

export interface BinningParameters {
  source_column: string;
  new_column: string;
  bins: BinningRule[];
  default_value?: unknown;
  keep_original?: boolean;
  overwrite?: boolean;
}

export interface RecodeParameters {
  source_column: string;
  new_column: string;
  mapping: Record<string, unknown>;
  default_value?: unknown;
  keep_original?: boolean;
  overwrite?: boolean;
}

export interface ConcatParameters { columns: string[]; new_column: string; separator: string; keep_original: boolean; overwrite: boolean; }
export interface CalculateParameters { columns: string[]; new_column: string; formula: string; keep_original: boolean; overwrite: boolean; }
export type TypeCorrectionTarget = "Int64" | "Float64" | "String" | "Boolean" | "Date" | "Datetime";
export interface TypeCorrectionParameters { column: string; target_type: TypeCorrectionTarget; }
export interface TypeRecommendationItem { column: string; currentType: string; suggestedType?: string | null; reason: string; availableTypes: TypeCorrectionTarget[]; }
export interface TypeCorrectionResult { column: string; originalType: string; newType: string; conversionFailures: number; preview: Record<string, unknown>[]; requiresConfirmation: boolean; }

export interface GetTransformationsInput {
  fileId: string;
  status?: TransformationStatus;
  type?: TransformationType;
  page?: number;
  limit?: number;
}

export interface GetTransformationsResponse {
  rows: TransformationInstance[];
  count: number;
}
