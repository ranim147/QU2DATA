export type SamplingSizeMode = "n" | "percent";
export type SystematicSamplingSizeMode = SamplingSizeMode | "k";
export type SamplingConfidence = 90 | 95 | 99;
export type SamplingMethod =
  | "simpleRandom"
  | "systematic"
  | "stratified"
  | "bootstrap"
  | "quotas";
export type StratifiedSamplingMode = "proportionnel" | "equilibre";

export interface SimpleRandomSamplingInput {
  fileId: string;
  size: number;
  sizeMode: SamplingSizeMode;
  seed: number;
  confidence: SamplingConfidence;
}

export interface SimpleRandomSamplingResult {
  fileId: string;
  source: string | null;
  output: string | null;
  hasPreview: boolean | null;
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
  preview: Array<Record<string, unknown>>;
}

export interface SimpleRandomSamplingResponse {
  success: boolean;
  message: string | null;
  data: SimpleRandomSamplingResult | null;
}

export interface ExecuteSimpleRandomSamplingData {
  executeSimpleRandomSampling: SimpleRandomSamplingResponse;
}

export interface ExecuteSimpleRandomSamplingVariables {
  input: SimpleRandomSamplingInput;
}

export interface SystematicSamplingInput {
  fileId: string;
  size: number;
  sizeMode: SystematicSamplingSizeMode;
  seed: number;
  confidence: SamplingConfidence;
}

export interface SystematicSamplingResult
  extends SimpleRandomSamplingResult {
  k: number | null;
  offset: number | null;
}

export interface BootstrapSamplingInput {
  fileId: string;
  sampleSize: number;
}

export interface BootstrapSamplingResult {
  fileId: string;
  message: string;
  rowsOriginal: number;
  rowsSampled: number;
  marginOfError: number;
  confidenceLevel: number;
  preview: Array<Record<string, unknown>>;
}

export interface StratifiedSamplingInput {
  fileId: string;
  strateColumn: string;
  sampleSize?: number | null;
  mode: StratifiedSamplingMode;
}

export interface StratifiedSamplingResult extends BootstrapSamplingResult {
  strateColumn: string;
  modalities: Array<Record<string, unknown>>;
}

export interface QuotaCellInput {
  values: Record<string, unknown>;
  target: number;
}

export interface QuotaSamplingInput {
  fileId: string;
  quotaColumns: string[];
  quotas: QuotaCellInput[];
  seed: number;
  confidence: SamplingConfidence;
  allowUnderfilled: boolean;
}

export interface QuotaResult {
  values: Record<string, unknown>;
  requested: number;
  available: number;
  selected: number;
  underfilled: boolean;
}

export interface QuotaSamplingResult {
  fileId: string;
  source: string | null;
  output: string | null;
  hasPreview: boolean | null;
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
  preview: Array<Record<string, unknown>>;
}

export type SamplingResult =
  | SimpleRandomSamplingResult
  | SystematicSamplingResult
  | BootstrapSamplingResult
  | StratifiedSamplingResult
  | QuotaSamplingResult;

export interface SamplingMutationResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
}

export interface SamplingFormProps<T> {
  disabled: boolean;
  suggestedSize: number | null;
  onSubmit: (input: T) => void;
}
