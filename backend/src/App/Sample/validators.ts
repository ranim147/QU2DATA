import { z } from "zod";

const uuid = z.string().uuid();

export const simpleRandomSamplingInputSchema = z
  .object({
    fileId: uuid,
    size: z.number().gt(0),
    sizeMode: z.enum(["n", "percent"]).default("n"),
    seed: z.number().int().default(42),
    confidence: z.union([z.literal(90), z.literal(95), z.literal(99)]).default(95),
  })
  .superRefine((input, context) => {
    if (input.sizeMode === "percent" && input.size > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["size"],
        message: "Percentage size must be between 0 and 100",
      });
    }
  });

const confidenceSchema = z.union([
  z.literal(90),
  z.literal(95),
  z.literal(99),
]);

export const systematicSamplingInputSchema = z
  .object({
    fileId: uuid,
    size: z.number().gt(0),
    sizeMode: z.enum(["n", "percent", "k"]).default("n"),
    seed: z.number().int().default(42),
    confidence: confidenceSchema.default(95),
  })
  .superRefine((input, context) => {
    if (input.sizeMode === "percent" && input.size > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["size"],
        message: "Percentage size must be between 0 and 100",
      });
    }
    if (input.sizeMode === "k" && input.size < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["size"],
        message: "Systematic interval k must be at least 1",
      });
    }
  });

export const bootstrapSamplingInputSchema = z.object({
  fileId: uuid,
  sampleSize: z.number().int().positive(),
});

export const stratifiedSamplingInputSchema = z.object({
  fileId: uuid,
  strateColumn: z.string().trim().min(1),
  sampleSize: z.number().int().positive().nullable().optional(),
  mode: z.enum(["proportionnel", "equilibre"]).default("proportionnel"),
});

export const quotaSamplingInputSchema = z.object({
  fileId: uuid,
  quotaColumns: z.array(z.string().trim().min(1)).min(1),
  quotas: z
    .array(
      z.object({
        values: z.record(z.unknown()).refine(
          (values) => Object.keys(values).length > 0,
          "Quota values cannot be empty"
        ),
        target: z.number().int().positive(),
      })
    )
    .min(1),
  seed: z.number().int().default(42),
  confidence: confidenceSchema.default(95),
  allowUnderfilled: z.boolean().default(false),
});

export const createSampleInputSchema = z.object({
  name: z.string().min(1),
  methodName: z.string().min(1),
  size: z.number().int().nonnegative(),
  fileId: uuid,
  isActive: z.boolean().optional(),
});

export const updateSampleInputSchema = z.object({
  sampleId: uuid,
  name: z.string().min(1).optional(),
  methodName: z.string().min(1).optional(),
  size: z.number().int().nonnegative().optional(),
  fileId: uuid.optional(),
  isActive: z.boolean().optional(),
});

export const deleteSampleInputSchema = z.object({
  sampleId: uuid,
});

export const getSampleByIdInputSchema = z.object({
  sampleId: uuid,
});

export const getSamplesByFileIdInputSchema = z.object({
  fileId: uuid,
});
