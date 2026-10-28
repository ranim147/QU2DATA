export type TransformationStatus =
  | "PENDING"
  | "PREVIEWED"
  | "APPLIED"
  | "CANCELLED"
  | "FAILED";

export type TransformationType =
  | "CONCAT_COLUMNS"
  | "CALCULATE_COLUMN"
  | "RECODE_COLUMN"
  | "BINNING_COLUMN"
  | "DEDUPLICATION"
  | "IMPUTATION"
  | "OUTLIER_TREATMENT"
  | "STANDARDIZATION"
  | "NORMALIZATION"
  | "LOG_TRANSFORM"
  | "ONE_HOT_ENCODING"
  | "ROW_FILTER"
  | "TYPE_CORRECTION";

export type ImputationMethod = "mean" | "median" | "mode" | "knn";

export interface ImputationParameters {
  method: ImputationMethod;
  columns: string[];
  n_neighbors: number;
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

export interface LogTransformAnalysisResult {
  results: Record<string, LogTransformColumnResult>;
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
export interface TypeRecommendationItem { column: string; currentType: string; suggestedType?: TypeCorrectionTarget | null; reason: string; availableTypes: TypeCorrectionTarget[]; }
export interface TypeRecommendations { correct: TypeRecommendationItem[]; toCorrect: TypeRecommendationItem[]; }
export interface TypeCorrectionResult { column: string; originalType: string; newType: string; conversionFailures: number; preview: Array<Record<string, unknown>>; requiresConfirmation: boolean; }

export type DeduplicationKeep = "first" | "last";

export interface DeduplicationParameters {
  subset: string[];
  keep: DeduplicationKeep;
  preview: true;
}

export interface DuplicateAnalysis {
  totalRows: number;
  duplicateCount: number;
  uniqueRows: number;
  duplicateRate: number;
  duplicatePreview: Array<Record<string, unknown>>;
  subsetUsed: string[];
}

export interface DeduplicationResult {
  subsetUsed: string[];
  keep: DeduplicationKeep;
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

export interface OutlierParameters {
  column: string;
  method: OutlierMethod;
  action: OutlierAction;
  factor: number;
  preview: true;
}

export interface OutlierColumnAnalysis extends Record<string, unknown> {
  method?: string;
  factor?: number;
  threshold?: number;
  alpha?: number;
  outlier_count?: number;
  outlier_indices?: Array<number | string>;
  outlier_values?: unknown[];
  lower_bound?: number;
  upper_bound?: number;
  Q1?: number;
  Q3?: number;
  IQR?: number;
}

export interface OutlierAnalysisResult {
  results: Record<string, OutlierColumnAnalysis>;
}

export interface OutlierTreatmentResult {
  outliersTreated: number;
  treatmentPreview: Array<Record<string, unknown>>;
  rows: number;
  currentPreview: Array<Record<string, unknown>>;
}

export interface DeduplicationRecommendationItem {
  column: string;
  duplicateRate: number;
  reason: string;
}

export interface DeduplicationRecommendationsData {
  recommended: DeduplicationRecommendationItem[];
  notAdvised: DeduplicationRecommendationItem[];
  lowDuplicate: DeduplicationRecommendationItem[];
}

export interface DeduplicationRecommendationsResponse {
  getDeduplicationRecommendations: {
    success: boolean;
    message: string;
    data?: DeduplicationRecommendationsData | null;
  };
}

export interface Transformation {
  id: string;
  name?: string | null;
  type?: TransformationType | null;
  parameters?: Record<string, unknown> | null;
  status?: TransformationStatus | null;
  errorMessage?: string | null;
  fileId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DatasetResult {
  success: boolean;
  message: string;
  columns: string[];
  rows: number;
  rowCount: number;
  data: Array<Record<string, unknown>>;
}

export type RowFilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "between" | "contains" | "not_contains" | "starts_with" | "ends_with" | "in" | "is_null" | "is_not_null";
export interface RowFilterCondition { column: string; operator: RowFilterOperator; value?: unknown; }
export interface RowSortRule { column: string; direction: "asc" | "desc"; }
export interface RowOperationResult { columns: string[]; rows: number; rowsBefore?: number | null; removedRows?: number | null; page: number; pageSize: number; totalPages: number; logic?: "AND" | "OR" | null; conditions: RowFilterCondition[]; sortBy: RowSortRule[]; data: Array<Record<string, unknown>>; }

export interface FileSummary {
  id: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
  createdAt?: string | null;
}

export interface GetFilesData {
  getFiles: {
    rows: FileSummary[];
    count: number;
  };
}

export interface TransformationResponse {
  success: boolean;
  message: string;
  transformation?: Transformation | null;
  deduplicationResult?: DeduplicationResult | null;
  outlierTreatmentResult?: OutlierTreatmentResult | null;
  typeCorrectionResult?: TypeCorrectionResult | null;
}

export interface GetTransformationsByFileData {
  getTransformationsByFile: {
    rows: Transformation[];
    count: number;
  };
}

export interface GetDatasetData {
  getCurrentDataset?: DatasetResult;
  getPreviewDataset?: DatasetResult;
}

export interface GetFileByIdData {
  getFileById: {
    success: boolean;
    message: string;
    file?: FileSummary | null;
  };
}

export interface CreateTransformationData {
  createTransformation: TransformationResponse;
}

export interface PreviewTransformationData {
  previewTransformation: TransformationResponse;
}

export interface AnalyzeDuplicatesData {
  analyzeDuplicates: {
    success: boolean;
    message: string;
    data?: DuplicateAnalysis | null;
  };
}

export interface ExecuteDeduplicationData {
  previewTransformation: TransformationResponse;
}

export interface AnalyzeOutliersData {
  analyzeOutliers: {
    success: boolean;
    message: string;
    data?: OutlierAnalysisResult | null;
  };
}

export interface AnalyzeLogTransformData {
  analyzeLogTransform: {
    success: boolean;
    message: string;
    data?: LogTransformAnalysisResult | null;
  };
}

export interface ExecuteOutlierTreatmentData {
  previewTransformation: TransformationResponse;
}

export interface ApplyTransformationData {
  applyTransformation: TransformationResponse;
}

export interface CancelTransformationData {
  cancelTransformation: TransformationResponse;
}
export interface RecommendTypesData { recommendTypes: { success: boolean; message: string; data?: TypeRecommendations | null; }; }
