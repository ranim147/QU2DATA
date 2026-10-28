export interface VariableQualityMetric {
  featureId: string;
  name: string;
  label: string | null;
  missingCount: number;
  missingPercentage: number;
  outliersCount: number;
  score: number;
  hasAnomaly: boolean;
}