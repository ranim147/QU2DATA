import { z } from "zod";

const uuid = z.string().uuid();

const featureType = z.enum([
  "metric",
  "dimension",
  "time",
  "text",
  "boolean",
  "category",
]);

const featureScale = z.enum([
  "nominale",
  "ordinale",
  "intervalle",
  "ratio",
]);

export const updateFeatureInputSchema = z.object({
  featureId: uuid,
  label: z.string().optional(),
  type: featureType.optional(),
  scale: featureScale.optional(),
  isVisible: z.boolean().optional(),
  weight: z.number().optional(),
});


export const correctFeatureTypeInputSchema = z.object({
  featureId: z.string(),
  targetType: z.enum([
    "Int64",
    "Float64",
    "String",
    "Boolean",
    "Date",
    "Datetime",
  ]),
});