import { GraphQLScalarType, Kind, ValueNode } from "graphql";
import { ContextWithUser } from "../../Directives/auth";
import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import {
  applyTransformationInputSchema,
  analyzeDuplicatesInputSchema,
  analyzeOutliersInputSchema,
  analyzeLogTransformInputSchema,
  cancelTransformationInputSchema,
  createTransformationInputSchema,
  getDatasetInputSchema,
  getTransformationsInputSchema,
  deduplicationFileInputSchema,
  previewTransformationInputSchema,
  updateTransformationInputSchema,
  viewRowsInputSchema, sortRowsInputSchema, filterRowsInputSchema,
} from "./validators";
import {
  ApplyTransformationInput,
  AnalyzeDuplicatesInput,
  AnalyzeOutliersInput,
  AnalyzeLogTransformInput,
  CancelTransformationInput,
  CreateTransformationInput,
  GetDatasetInput,
  GetTransformationsInput,
  DeduplicationFileInput,
  PreviewTransformationInput,
  UpdateTransformationInput,
  RowViewInput, RowSortInput, RowFilterInput,
} from "./types";
import {
  applyTransformation,
  cancelTransformation,
  createTransformation,
  deleteTransformation,
  getTransformationById,
  getTransformationsByFile,
  getCurrentDataset,
  getPreviewDataset,
  analyzeDeduplication,
  getDeduplicationRecommendations,
  analyzeOutliers,
  analyzeLogTransform,
  viewRows,
  sortRows,
  filterRows,
  recommendTypes,
  previewTransformation,
  updateTransformation,
} from "./service";

interface TransformationIdArgs {
  id: string;
}

const parseJsonLiteral = (node: ValueNode): unknown => {
  switch (node.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return node.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(node.value);
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return node.values.map(parseJsonLiteral);
    case Kind.OBJECT:
      return node.fields.reduce<Record<string, unknown>>((result, field) => {
        result[field.name.value] = parseJsonLiteral(field.value);
        return result;
      }, {});
    default:
      return undefined;
  }
};

const jsonScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: parseJsonLiteral,
});

const resolvers = {
  JSON: jsonScalar,

  Query: {
    recommendTypes: async (_: unknown, args: { fileId: string }, context: ContextWithUser) => { const parsed = deduplicationFileInputSchema.safeParse(args); return parsed.success ? recommendTypes(parsed.data.fileId, context.user?.id) : { success: false, message: "Input validation failed", data: null }; },
    viewRows: async (_: unknown, args: RowViewInput, context: ContextWithUser) => { const parsed = viewRowsInputSchema.safeParse(args); if (!parsed.success) return { success: false, message: "Input validation failed", data: null }; return viewRows(parsed.data as RowViewInput, context.user?.id); },
    sortRows: async (_: unknown, args: RowSortInput, context: ContextWithUser) => { const parsed = sortRowsInputSchema.safeParse(args); if (!parsed.success) return { success: false, message: "Input validation failed", data: null }; return sortRows(parsed.data as RowSortInput, context.user?.id); },
    filterRows: async (_: unknown, args: RowFilterInput, context: ContextWithUser) => { const parsed = filterRowsInputSchema.safeParse(args); if (!parsed.success) return { success: false, message: "Input validation failed", data: null }; return filterRows(parsed.data as RowFilterInput, context.user?.id); },
    analyzeLogTransform: async (_: unknown, args: AnalyzeLogTransformInput) => {
      const result = analyzeLogTransformInputSchema.safeParse(args);
      if (!result.success) {
        return { success: false, message: "Input validation failed", data: null };
      }
      return await analyzeLogTransform(result.data as AnalyzeLogTransformInput);
    },

    analyzeOutliers: async (_: unknown, args: AnalyzeOutliersInput) => {
      const result = analyzeOutliersInputSchema.safeParse(args);
      if (!result.success) {
        return {
          success: false,
          message: "Input validation failed",
          data: null,
        };
      }
      return await analyzeOutliers(result.data as AnalyzeOutliersInput);
    },

    getDeduplicationRecommendations: async (
      _: unknown,
      args: DeduplicationFileInput
    ) => {
      const result = deduplicationFileInputSchema.safeParse(args);
      if (!result.success) {
        return {
          success: false,
          message: "Input validation failed",
          data: null,
        };
      }
      return await getDeduplicationRecommendations(
        result.data as DeduplicationFileInput
      );
    },

    analyzeDuplicates: async (
      _: unknown,
      args: AnalyzeDuplicatesInput
    ) => {
      const result = analyzeDuplicatesInputSchema.safeParse(args);
      if (!result.success) {
        return {
          success: false,
          message: "Input validation failed",
          data: null,
        };
      }
      return await analyzeDeduplication(result.data as AnalyzeDuplicatesInput);
    },

    getCurrentDataset: async (
      _: unknown,
      args: GetDatasetInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(args, getDatasetInputSchema);

      if (result === true) {
        return await getCurrentDataset(args, context.user?.id);
      }

      return {
        ...result,
        columns: [],
        rows: 0,
        rowCount: 0,
        data: [],
      };
    },

    getPreviewDataset: async (
      _: unknown,
      args: GetDatasetInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(args, getDatasetInputSchema);

      if (result === true) {
        return await getPreviewDataset(args, context.user?.id);
      }

      return {
        ...result,
        columns: [],
        rows: 0,
        rowCount: 0,
        data: [],
      };
    },

    getTransformationById: async (
      _: unknown,
      args: TransformationIdArgs
    ) => {
      const result = parseDataValidation(
        args,
        updateTransformationInputSchema.pick({ id: true })
      );

      if (result === true) {
        return await getTransformationById(args.id);
      }

      return {
        ...result,
        transformation: null,
      };
    },

    getTransformationsByFile: async (
      _: unknown,
      args: GetTransformationsInput
    ) => {
      const result = parseDataValidation(args, getTransformationsInputSchema);

      if (result === true) {
        return await getTransformationsByFile(args);
      }

      return {
        rows: [],
        count: 0,
      };
    },
  },

  Mutation: {
    createTransformation: async (
      _: unknown,
      args: CreateTransformationInput
    ) => {
      const result = parseDataValidation(args, createTransformationInputSchema);

      if (result === true) {
        return await createTransformation(args);
      }

      return {
        ...result,
        transformation: null,
      };
    },

    updateTransformation: async (
      _: unknown,
      args: UpdateTransformationInput
    ) => {
      const result = parseDataValidation(args, updateTransformationInputSchema);

      if (result === true) {
        return await updateTransformation(args);
      }

      return {
        ...result,
        transformation: null,
      };
    },

    previewTransformation: async (
      _: unknown,
      args: PreviewTransformationInput
    ) => {
      const result = parseDataValidation(
        args,
        previewTransformationInputSchema
      );

      if (result === true) {
        return await previewTransformation(args.transformationId);
      }

      return {
        ...result,
        transformation: null,
      };
    },

    applyTransformation: async (
      _: unknown,
      args: ApplyTransformationInput
    ) => {
      const result = parseDataValidation(
        args,
        applyTransformationInputSchema
      );

      if (result === true) {
        return await applyTransformation(args.transformationId);
      }

      return {
        ...result,
        transformation: null,
      };
    },

    cancelTransformation: async (
      _: unknown,
      args: CancelTransformationInput
    ) => {
      const result = parseDataValidation(
        args,
        cancelTransformationInputSchema
      );

      if (result === true) {
        return await cancelTransformation(args.transformationId);
      }

      return {
        ...result,
        transformation: null,
      };
    },

    deleteTransformation: async (
      _: unknown,
      args: TransformationIdArgs
    ) => {
      const result = parseDataValidation(
        args,
        updateTransformationInputSchema.pick({ id: true })
      );

      if (result === true) {
        return await deleteTransformation(args.id);
      }

      return result;
    },
  },
};

export default resolvers;
