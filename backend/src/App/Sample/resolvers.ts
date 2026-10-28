import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import {
  createSampleInputSchema,
  deleteSampleInputSchema,
  getSampleByIdInputSchema,
  getSamplesByFileIdInputSchema,
  updateSampleInputSchema,
  simpleRandomSamplingInputSchema,
  bootstrapSamplingInputSchema,
  quotaSamplingInputSchema,
  stratifiedSamplingInputSchema,
  systematicSamplingInputSchema,
} from "./validators";
import {
  DeleteSampleArgs,
  GetSampleByIdArgs,
  GetSamplesByFileIdArgs,
  CreateSampleInput,
  UpdateSampleInput,
  SimpleRandomSamplingInput,
  BootstrapSamplingInput,
  QuotaSamplingInput,
  StratifiedSamplingInput,
  SystematicSamplingInput,
} from "./types";
import {
  createSample,
  deleteSample,
  getSampleById,
  getSamples,
  getSamplesByFileId,
  updateSample,
  executeSimpleRandomSampling,
  executeBootstrapSampling,
  executeQuotaSampling,
  executeStratifiedSampling,
  executeSystematicSampling,
} from "./service";
import { ContextWithUser } from "../../Directives/auth";

const resolvers = {
  Query: {
    getSamples: async () => {
      return await getSamples();
    },

    getSampleById: async (_: unknown, args: GetSampleByIdArgs) => {
      const result = parseDataValidation(args, getSampleByIdInputSchema);

      if (result === true) {
        return await getSampleById(args);
      }

      return {
        ...result,
        sample: null,
      };
    },

    getSamplesByFileId: async (_: unknown, args: GetSamplesByFileIdArgs) => {
      const result = parseDataValidation(args, getSamplesByFileIdInputSchema);

      if (result === true) {
        return await getSamplesByFileId(args);
      }

      return {
        rows: [],
        count: 0,
      };
    },
  },

  Mutation: {
    executeSimpleRandomSampling: async (
      _: unknown,
      args: { input: SimpleRandomSamplingInput },
      context: ContextWithUser
    ) => {
      const parsed = simpleRandomSamplingInputSchema.safeParse(args.input);

      if (!parsed.success) {
        return {
          success: false,
          message: "INPUT VALIDATION FAILED",
          data: null,
        };
      }

      return executeSimpleRandomSampling(
        parsed.data as SimpleRandomSamplingInput,
        context.user.id
      );
    },

    executeSystematicSampling: async (
      _: unknown,
      args: { input: SystematicSamplingInput },
      context: ContextWithUser
    ) => {
      const parsed = systematicSamplingInputSchema.safeParse(args.input);
      return parsed.success
        ? executeSystematicSampling(
            parsed.data as SystematicSamplingInput,
            context.user.id
          )
        : { success: false, message: "INPUT VALIDATION FAILED", data: null };
    },

    executeBootstrapSampling: async (
      _: unknown,
      args: { input: BootstrapSamplingInput },
      context: ContextWithUser
    ) => {
      const parsed = bootstrapSamplingInputSchema.safeParse(args.input);
      return parsed.success
        ? executeBootstrapSampling(
            parsed.data as BootstrapSamplingInput,
            context.user.id
          )
        : { success: false, message: "INPUT VALIDATION FAILED", data: null };
    },

    executeStratifiedSampling: async (
      _: unknown,
      args: { input: StratifiedSamplingInput },
      context: ContextWithUser
    ) => {
      const parsed = stratifiedSamplingInputSchema.safeParse(args.input);
      return parsed.success
        ? executeStratifiedSampling(
            parsed.data as StratifiedSamplingInput,
            context.user.id
          )
        : { success: false, message: "INPUT VALIDATION FAILED", data: null };
    },

    executeQuotaSampling: async (
      _: unknown,
      args: { input: QuotaSamplingInput },
      context: ContextWithUser
    ) => {
      const parsed = quotaSamplingInputSchema.safeParse(args.input);
      return parsed.success
        ? executeQuotaSampling(
            parsed.data as QuotaSamplingInput,
            context.user.id
          )
        : { success: false, message: "INPUT VALIDATION FAILED", data: null };
    },

    createSample: async (_: unknown, args: CreateSampleInput) => {
      const result = parseDataValidation(args, createSampleInputSchema);

      if (result === true) {
        return await createSample(args);
      }

      return {
        ...result,
        sample: null,
      };
    },

    updateSample: async (_: unknown, args: UpdateSampleInput) => {
      const result = parseDataValidation(args, updateSampleInputSchema);

      if (result === true) {
        return await updateSample(args);
      }

      return {
        ...result,
        sample: null,
      };
    },

    deleteSample: async (_: unknown, args: DeleteSampleArgs) => {
      const result = parseDataValidation(args, deleteSampleInputSchema);

      if (result === true) {
        return await deleteSample(args.sampleId);
      }

      return result;
    },
  },
};

export default resolvers;
