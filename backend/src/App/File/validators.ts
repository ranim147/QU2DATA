import { z } from "zod";

const uuid = z.string().uuid();

export const createFileInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().nonnegative(),
  minioId: z.string().min(1),
});

export const updateFileInputSchema = z.object({
  fileId: uuid,
  name: z.string().min(1).optional(),
});

export const deleteFileInputSchema = z.object({
  fileId: uuid,
});

export const getFileByIdInputSchema = z.object({
  fileId: uuid,
});

export const getFilesByProjectInputSchema = z
  .object({
    projectId: uuid,
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  })
  .strict();

const fileMergeBaseShape = {
  projectId: uuid,
  leftFileId: uuid,
  rightFileId: uuid,
};

const distinctFileIds = (
  input: { leftFileId: string; rightFileId: string },
  context: z.RefinementCtx
) => {
  if (input.leftFileId === input.rightFileId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SOURCE FILES MUST BE DIFFERENT",
      path: ["rightFileId"],
    });
  }
};

export const recommendFileMergeInputSchema = z
  .object(fileMergeBaseShape)
  .strict()
  .superRefine(distinctFileIds);

const fileMergeConfigurationShape = {
  ...fileMergeBaseShape,
  operation: z.enum(["CONCAT_VERTICAL", "JOIN_BY_KEY", "UPSERT"]),
  columnMapping: z.record(z.string().trim().min(1)).default({}),
  joinKeys: z.array(z.string().trim().min(1)).default([]),
  joinType: z.enum(["inner", "left", "outer"]).default("left"),
  addSourceColumn: z.boolean().default(true),
  sourceColumnName: z.string().trim().min(1).max(255).default("_source_file"),
  previewLimit: z.number().int().min(1).max(100).default(20),
  rightPrecedence: z.boolean().default(true),
  updateNonNullOnly: z.boolean().default(true),
};

const validateFileMergeConfiguration = (
  input: any,
  context: z.RefinementCtx
) => {
  distinctFileIds(input, context);
  if (
    ["JOIN_BY_KEY", "UPSERT"].includes(input.operation) &&
    input.joinKeys.length === 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "AT LEAST ONE JOIN KEY IS REQUIRED",
      path: ["joinKeys"],
    });
  }
  if (new Set(input.joinKeys).size !== input.joinKeys.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "JOIN KEYS MUST BE UNIQUE",
      path: ["joinKeys"],
    });
  }
};

export const previewFileMergeInputSchema = z
  .object(fileMergeConfigurationShape)
  .strict()
  .superRefine(validateFileMergeConfiguration);

export const executeFileMergeInputSchema = z
  .object({
    ...fileMergeConfigurationShape,
    outputName: z.string().trim().min(1).max(255),
  })
  .strict()
  .superRefine(validateFileMergeConfiguration);
