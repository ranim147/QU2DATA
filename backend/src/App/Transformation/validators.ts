import { z } from "zod";
import { TRANSFORMATION_TYPES } from "./types";

const uuid = z.string().uuid();

const transformationName = z.string().trim().min(1).max(255);

export const transformationTypeSchema = z.enum(TRANSFORMATION_TYPES);

export const transformationStatusSchema = z.enum([
  "PENDING",
  "PREVIEWED",
  "APPLIED",
  "CANCELLED",
  "FAILED",
]);

const parametersSchema = z.record(z.unknown());

const deduplicationSubsetSchema = z
  .array(z.string())
  .optional()
  .superRefine((columns, context) => {
    if (columns?.some((column) => column.trim().length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "subset must not contain empty column names",
      });
    }
  })
  .transform((columns) => {
    if (!columns) return undefined;

    const normalized = columns.map((column) => column.trim());
    return [...new Set(normalized)];
  });

export const deduplicationParametersSchema = z
  .object({
    subset: deduplicationSubsetSchema,
    keep: z.enum(["first", "last"]).default("first"),
    preview: z.boolean().optional().transform(() => true as const),
  })
  .strict();

export const deduplicationFileInputSchema = z
  .object({
    fileId: uuid,
  })
  .strict();

export const analyzeDuplicatesInputSchema = z
  .object({
    fileId: uuid,
    subset: deduplicationSubsetSchema,
  })
  .strict();

const outlierMethodSchema = z.enum(["iqr", "zscore", "grubbs"]);
const outlierActionSchema = z.enum([
  "delete",
  "replace_median",
  "replace_mean",
  "mark",
  "ignore",
]);
const outlierColumnSchema = z.string().trim().min(1);

export const outlierTreatmentParametersSchema = z
  .object({
    column: outlierColumnSchema,
    method: outlierMethodSchema,
    action: outlierActionSchema,
    factor: z.number().finite(),
    preview: z.boolean().optional().transform(() => true as const),
  })
  .strict();

const standardizationColumnSchema = z.string().trim().min(1);

export const standardizationParametersSchema = z
  .object({
    columns: z
      .array(standardizationColumnSchema)
      .min(1)
      .superRefine((columns, context) => {
        if (new Set(columns).size !== columns.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "columns must contain unique names",
          });
        }
      }),
    method: z.enum(["z_score", "min_max", "robust"]),
    preview_limit: z.number().int().min(1).max(500).optional(),
  })
  .strict();

export const normalizationParametersSchema = z
  .object({
    columns: z
      .array(z.string().trim().min(1))
      .min(1)
      .superRefine((columns, context) => {
        if (new Set(columns).size !== columns.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "columns must contain unique names",
          });
        }
      }),
    preview_limit: z.number().int().min(1).max(500).optional(),
  })
  .strict();

export const oneHotEncodingParametersSchema = z
  .object({
    columns: z
      .array(z.string().trim().min(1))
      .min(1)
      .superRefine((columns, context) => {
        if (new Set(columns).size !== columns.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "columns must contain unique names",
          });
        }
      }),
    drop_first: z.boolean().default(false),
    drop_original: z.boolean().default(true),
    preview_limit: z.number().int().min(1).max(500).optional(),
  })
  .strict();

const logTransformColumnsSchema = z
  .array(z.string().trim().min(1))
  .min(1)
  .superRefine((columns, context) => {
    if (new Set(columns).size !== columns.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "columns must contain unique names",
      });
    }
  });

export const logTransformParametersSchema = z
  .object({
    columns: logTransformColumnsSchema,
    method: z.enum(["log1p", "log"]).default("log1p"),
    action: z.enum(["replace", "new_column", "ignore"]).default("replace"),
  })
  .strict();

export const analyzeLogTransformInputSchema = z
  .object({
    fileId: uuid,
    columns: logTransformColumnsSchema,
    method: z.enum(["log1p", "log"]).default("log1p"),
  })
  .strict();

const columnNameSchema = z.string().trim().min(1);

const uniqueColumnsSchema = (minimum: number) => z.array(columnNameSchema).min(minimum).superRefine((columns, context) => {
  if (new Set(columns).size !== columns.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "columns must contain unique names" });
});
export const concatParametersSchema = z.object({ columns: uniqueColumnsSchema(2), new_column: columnNameSchema, separator: z.string().default("-"), keep_original: z.boolean().default(true), overwrite: z.boolean().default(false) }).strict();
export const calculateParametersSchema = z.object({ columns: uniqueColumnsSchema(1), new_column: columnNameSchema, formula: z.string().trim().min(1).max(1000), keep_original: z.boolean().default(true), overwrite: z.boolean().default(false) }).strict().superRefine((parameters, context) => {
  if (parameters.columns.some((column) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(column))) context.addIssue({ code: z.ZodIssueCode.custom, message: "formula columns must be valid identifiers" });
  if (!/^[A-Za-z0-9_+\-*/%().,\s]+$/.test(parameters.formula) || parameters.formula.includes("//")) context.addIssue({ code: z.ZodIssueCode.custom, message: "formula contains unsupported syntax" });
  let depth = 0; for (const character of parameters.formula) { if (character === "(") depth += 1; if (character === ")") depth -= 1; if (depth < 0) break; }
  if (depth !== 0) context.addIssue({ code: z.ZodIssueCode.custom, message: "formula parentheses are unbalanced" });
  const identifiers = parameters.formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  const unknown = identifiers.filter((identifier) => !["abs", "round", ...parameters.columns].includes(identifier));
  if (unknown.length) context.addIssue({ code: z.ZodIssueCode.custom, message: `formula contains undeclared identifiers: ${[...new Set(unknown)].join(", ")}` });
  const functions = [...parameters.formula.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map((match) => match[1]);
  if (functions.some((name) => !["abs", "round"].includes(name))) context.addIssue({ code: z.ZodIssueCode.custom, message: "formula contains an unsupported function" });
});
export const typeCorrectionParametersSchema = z.object({ column: columnNameSchema, target_type: z.enum(["Int64", "Float64", "String", "Boolean", "Date", "Datetime"]) }).strict();

export const binningParametersSchema = z
  .object({
    source_column: columnNameSchema,
    new_column: columnNameSchema,
    bins: z
      .array(
        z
          .object({
            label: z.string().trim().min(1),
            min: z.number().finite(),
            max: z.number().finite(),
          })
          .strict()
          .refine((rule) => rule.min <= rule.max, {
            message: "bin min must be less than or equal to max",
          })
      )
      .min(1),
    default_value: z.unknown().optional(),
    keep_original: z.boolean().default(true),
    overwrite: z.boolean().default(false),
  })
  .strict();

export const recodeParametersSchema = z
  .object({
    source_column: columnNameSchema,
    new_column: columnNameSchema,
    mapping: z.record(z.unknown()).superRefine((mapping, context) => {
      const keys = Object.keys(mapping);
      if (keys.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "mapping must not be empty",
        });
      }
      if (keys.some((key) => key.trim().length === 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "mapping keys must not be empty",
        });
      }
    }),
    default_value: z.unknown().optional(),
    keep_original: z.boolean().default(true),
    overwrite: z.boolean().default(false),
  })
  .strict();

export const analyzeOutliersInputSchema = z
  .object({
    fileId: uuid,
    columns: z
      .array(outlierColumnSchema)
      .min(1)
      .transform((columns) => Array.from(new Set(columns))),
    method: outlierMethodSchema,
    factor: z.number().finite(),
  })
  .strict();

export const createTransformationInputSchema = z
  .object({
    name: transformationName,
    type: transformationTypeSchema,
    parameters: parametersSchema,
    fileId: uuid,
  })
  .strict();

export const updateTransformationInputSchema = z
  .object({
    id: uuid,
    name: transformationName.optional(),
    parameters: parametersSchema.optional(),
  })
  .strict();

export const previewTransformationInputSchema = z
  .object({
    transformationId: uuid,
  })
  .strict();

export const applyTransformationInputSchema = z
  .object({
    transformationId: uuid,
  })
  .strict();

export const cancelTransformationInputSchema = z
  .object({
    transformationId: uuid,
  })
  .strict();

export const getDatasetInputSchema = z
  .object({
    fileId: uuid,
    limit: z.number().int().positive().max(500).optional(),
  })
  .strict();

const rowColumnSchema = z.string().trim().min(1);
const rowOperatorSchema = z.enum(["=", "!=", ">", ">=", "<", "<=", "between", "contains", "not_contains", "starts_with", "ends_with", "in", "is_null", "is_not_null"]);
export const rowFilterConditionSchema = z.object({
  column: rowColumnSchema,
  operator: rowOperatorSchema,
  value: z.unknown().optional(),
}).strict().superRefine((condition, context) => {
  if (["is_null", "is_not_null"].includes(condition.operator)) return;
  if (condition.value === undefined || condition.value === null) context.addIssue({ code: z.ZodIssueCode.custom, message: `operator '${condition.operator}' requires a value` });
  if (condition.operator === "between") {
    if (!Array.isArray(condition.value) || condition.value.length !== 2 || condition.value.some((value) => typeof value !== "number" || !Number.isFinite(value))) context.addIssue({ code: z.ZodIssueCode.custom, message: "between requires exactly two finite numbers" });
    else if (condition.value[0] > condition.value[1]) context.addIssue({ code: z.ZodIssueCode.custom, message: "between lower value must not exceed upper value" });
  }
  if ([">", ">=", "<", "<="].includes(condition.operator) && (typeof condition.value !== "number" || !Number.isFinite(condition.value))) context.addIssue({ code: z.ZodIssueCode.custom, message: `${condition.operator} requires a finite number` });
  if (["contains", "not_contains", "starts_with", "ends_with"].includes(condition.operator) && typeof condition.value !== "string") context.addIssue({ code: z.ZodIssueCode.custom, message: `${condition.operator} requires text` });
  if (condition.operator === "in" && (!Array.isArray(condition.value) || condition.value.length === 0)) context.addIssue({ code: z.ZodIssueCode.custom, message: "in requires a non-empty array" });
});
const rowSortRuleSchema = z.object({ column: rowColumnSchema, direction: z.enum(["asc", "desc"]) }).strict();
const paginationShape = { fileId: uuid, page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(500).default(20) };
export const viewRowsInputSchema = z.object({ ...paginationShape, columns: z.array(rowColumnSchema).optional().superRefine((columns, context) => { if (columns && new Set(columns).size !== columns.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "columns must be unique" }); }), conditions: z.array(rowFilterConditionSchema).default([]), logic: z.enum(["AND", "OR"]).default("AND"), sortBy: z.array(rowSortRuleSchema).default([]) }).strict();
export const filterRowsInputSchema = z.object({ ...paginationShape, conditions: z.array(rowFilterConditionSchema).min(1), logic: z.enum(["AND", "OR"]).default("AND") }).strict();
export const sortRowsInputSchema = z.object({ ...paginationShape, sortBy: z.array(rowSortRuleSchema).min(1) }).strict();

export const getTransformationsInputSchema = z
  .object({
    fileId: uuid,
    status: transformationStatusSchema.optional(),
    type: transformationTypeSchema.optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
  })
  .strict();
