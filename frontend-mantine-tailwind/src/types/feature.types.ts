export type FeatureType =
  | "metric"
  | "dimension"
  | "time"
  | "text"
  | "boolean"
  | "category";

export type FeatureScale = "nominal" | "ordinal" | "interval" | "ratio";

export interface Feature {
  id: string;
  name: string;
  label: string | null;
  type: FeatureType;
  scale: FeatureScale | null;
  isVisible: boolean;
  weight: number;
  fileId: string;
  createdAt: string;
  updatedAt: string;
}