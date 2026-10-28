// Seuils de niveau, repris tels quels du cahier des charges :
// Excellent (≥90), Très bon (≥75), Acceptable (≥60), À améliorer (<60)
export type QualityLevel = "excellent" | "good" | "acceptable" | "poor";

export interface QualityLevelInfo {
  level: QualityLevel;
  labelKey: string; // clé i18n
}

export function getQualityLevel(score: number): QualityLevelInfo {
  if (score >= 90) return { level: "excellent", labelKey: "level_excellent" };
  if (score >= 75) return { level: "good", labelKey: "level_good" };
  if (score >= 60) return { level: "acceptable", labelKey: "level_acceptable" };
  return { level: "poor", labelKey: "level_poor" };
}

// Couleur associée à chaque niveau (reprend la palette brand + rouge/orange pour les alertes)
export const LEVEL_COLORS: Record<QualityLevel, string> = {
  excellent: "#84BF43",
  good: "#9fd64d",
  acceptable: "#f0a83d",
  poor: "#e05252",
};

// Les 5 dimensions affichées en cards, dans l'ordre voulu
export interface DimensionDefinition {
  key: "completeness" | "consistency" | "validity" | "uniqueness" | "accuracy";
  labelKey: string;
}

export const DIMENSIONS: DimensionDefinition[] = [
  { key: "completeness", labelKey: "dimension_completeness" },
  { key: "consistency", labelKey: "dimension_consistency" },
  { key: "validity", labelKey: "dimension_validity" },
  { key: "uniqueness", labelKey: "dimension_uniqueness" },
  { key: "accuracy", labelKey: "dimension_accuracy" },
];