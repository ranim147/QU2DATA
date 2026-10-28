import { FeatureScale, FeatureType } from "../../types/feature.types";

export interface SelectOption<T extends string> {
  value: T;
  labelKey: string;
}

export const FEATURE_TYPE_OPTIONS: SelectOption<FeatureType>[] = [
  { value: "metric", labelKey: "type_metric" },
  { value: "dimension", labelKey: "type_dimension" },
  { value: "time", labelKey: "type_time" },
  { value: "text", labelKey: "type_text" },
  { value: "boolean", labelKey: "type_boolean" },
  { value: "category", labelKey: "type_category" },
];

export const FEATURE_SCALE_OPTIONS: SelectOption<FeatureScale>[] = [
  { value: "nominal", labelKey: "scale_nominal" },
  { value: "ordinal", labelKey: "scale_ordinal" },
  { value: "interval", labelKey: "scale_interval" },
  { value: "ratio", labelKey: "scale_ratio" },
];

// Couleurs Mantine (thème existant) associées à chaque type de variable,
// utilisées pour le petit badge coloré dans le Select du tableau.
export const FEATURE_TYPE_COLORS: Record<FeatureType, string> = {
  metric: "blue",
  dimension: "grape",
  time: "yellow",
  text: "gray",
  boolean: "teal",
  category: "pink",
};