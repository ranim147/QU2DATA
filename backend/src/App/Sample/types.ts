import { SampleInstance } from "./model/sample.model";

export type SamplingSizeMode = "n" | "percent";
export type SystematicSamplingSizeMode = SamplingSizeMode | "k";
export type StratifiedSamplingMode = "proportionnel" | "equilibre";

export interface SimpleRandomSamplingInput {
  fileId: string;
  size: number;
  sizeMode?: SamplingSizeMode;
  seed?: number;
  confidence?: 90 | 95 | 99;
}

export interface SimpleRandomSamplingFastApiData {
  file_id: string;
  source?: string | null;
  output?: string | null;
  has_preview?: boolean | null;
  method: string;
  total_rows: number;
  sample_size: number;
  size_mode: string;
  size_value: number;
  seed: number;
  confidence: number;
  selected_indices: number[];
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
  data: Record<string, unknown>[];
}

export interface SimpleRandomSamplingResult {
  fileId: string;
  source?: string | null;
  output?: string | null;
  hasPreview?: boolean | null;
  method: string;
  totalRows: number;
  sampleSize: number;
  sizeMode: string;
  sizeValue: number;
  seed: number;
  confidence: number;
  selectedIndices: number[];
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
  data: Record<string, unknown>[];
}

export interface SimpleRandomSamplingResponse {
  success: boolean;
  message: string;
  data: SimpleRandomSamplingResult | null;
}

export interface SystematicSamplingInput {
  fileId: string;
  size: number;
  sizeMode?: SystematicSamplingSizeMode;
  seed?: number;
  confidence?: 90 | 95 | 99;
}

export interface SystematicSamplingFastApiData
  extends SimpleRandomSamplingFastApiData {
  k?: number | null;
  offset?: number | null;
}

export interface SystematicSamplingResult extends SimpleRandomSamplingResult {
  k?: number | null;
  offset?: number | null;
}

export interface BootstrapSamplingInput {
  fileId: string;
  sampleSize: number;
}

export interface BootstrapSamplingFastApiData {
  file_id: string;
  message: string;
  rows_original: number;
  rows_sampled: number;
  marge_erreur: number;
  niveau_confiance: number;
  preview: Record<string, unknown>[];
}

export interface BootstrapSamplingResult {
  fileId: string;
  message: string;
  rowsOriginal: number;
  rowsSampled: number;
  marginOfError: number;
  confidenceLevel: number;
  preview: Record<string, unknown>[];
}

export interface StratifiedSamplingInput {
  fileId: string;
  strateColumn: string;
  sampleSize?: number | null;
  mode?: StratifiedSamplingMode;
}

export interface StratifiedSamplingFastApiData
  extends BootstrapSamplingFastApiData {
  strate_col: string;
  modalites: Record<string, unknown>[];
}

export interface StratifiedSamplingResult extends BootstrapSamplingResult {
  strateColumn: string;
  modalities: Record<string, unknown>[];
}

export interface QuotaCellInput {
  values: Record<string, unknown>;
  target: number;
}

export interface QuotaSamplingInput {
  fileId: string;
  quotaColumns: string[];
  quotas: QuotaCellInput[];
  seed?: number;
  confidence?: 90 | 95 | 99;
  allowUnderfilled?: boolean;
}

export interface QuotaResult {
  values: Record<string, unknown>;
  requested: number;
  available: number;
  selected: number;
  underfilled: boolean;
}

export interface QuotaSamplingFastApiData {
  file_id: string;
  source?: string | null;
  output?: string | null;
  has_preview?: boolean | null;
  method: string;
  total_rows: number;
  sample_size: number;
  seed: number;
  confidence: number;
  quota_columns: string[];
  quota_results: QuotaResult[];
  selected_indices: number[];
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
  data: Record<string, unknown>[];
}

export interface QuotaSamplingResult {
  fileId: string;
  source?: string | null;
  output?: string | null;
  hasPreview?: boolean | null;
  method: string;
  totalRows: number;
  sampleSize: number;
  seed: number;
  confidence: number;
  quotaColumns: string[];
  quotaResults: QuotaResult[];
  selectedIndices: number[];
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
  data: Record<string, unknown>[];
}

export interface SamplingExecutionResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface CreateSampleInput {
  name: string;
  methodName: string;
  size: number;
  fileId: string;
  isActive?: boolean;
}

export interface UpdateSampleInput {
  sampleId: string;
  name?: string;
  methodName?: string;
  size?: number;
  fileId?: string;
  isActive?: boolean;
}

export interface GetSampleByIdArgs {
  sampleId: string;
}

export interface GetSampleByIdInput {
  sampleId: string;
}

export interface DeleteSampleArgs {
  sampleId: string;
}

export interface GetSamplesByFileIdArgs {
  fileId: string;
}

export interface GetSamplesByFileIdInput {
  fileId: string;
}

export interface SampleResponse {
  success: boolean;
  message: string;
  sample?: SampleInstance | null;
}

export interface GetSamplesResponse {
  rows: SampleInstance[];
  count: number;
}

export interface BasicSampleResponse {
  success: boolean;
  message: string;
}
