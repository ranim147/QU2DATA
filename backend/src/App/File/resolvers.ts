import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import {
  deleteFileInputSchema,
  executeFileMergeInputSchema,
  getFileByIdInputSchema,
  getFilesByProjectInputSchema,
  previewFileMergeInputSchema,
  recommendFileMergeInputSchema,
  updateFileInputSchema,
} from "./validators";
import {
  DeleteFileInput,
  ExecuteFileMergeInput,
  GetFileByIdInput,
  GetFilesByProjectInput,
  GetFilesOptions,
  PreviewFileMergeInput,
  RecommendFileMergeInput,
  UpdateFileInput,
} from "./types";
import {
  deleteFile,
  executeFileMerge,
  getFileById,
  getFiles,
  getFilesByProject,
  previewFileMerge,
  recommendFileMerge,
  updateFile,
} from "./service";
import { ContextWithUser } from "../../Directives/auth";

const resolvers = {
  Query: {
   getFiles: async (
      _: any,
      args: GetFilesOptions,
      context: ContextWithUser
    ) => {
      return await getFiles(args, context.user.id);
    },

    getFilesByProject: async (
      _: unknown,
      args: GetFilesByProjectInput,
      context: ContextWithUser
    ) => {
      const parsed = getFilesByProjectInputSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error("INPUT VALIDATION FAILED");
      }

      return getFilesByProject(
        parsed.data as GetFilesByProjectInput,
        context.user.id
      );
    },

    getFileById: async (_: any, args: GetFileByIdInput) => {
      const result = parseDataValidation(args, getFileByIdInputSchema);

      if (result === true) {
        return await getFileById(args);
      }

      return {
        ...result,
        file: null,
      };
    },

    recommendFileMerge: async (
      _: unknown,
      args: { input: RecommendFileMergeInput },
      context: ContextWithUser
    ) => {
      const parsed = recommendFileMergeInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          message: "Input validation failed",
          data: null,
        };
      }
      return recommendFileMerge(
        parsed.data as RecommendFileMergeInput,
        context.user.id
      );
    },

    previewFileMerge: async (
      _: unknown,
      args: { input: PreviewFileMergeInput },
      context: ContextWithUser
    ) => {
      const parsed = previewFileMergeInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          message: "Input validation failed",
          data: null,
        };
      }
      return previewFileMerge(
        parsed.data as PreviewFileMergeInput,
        context.user.id
      );
    },
  },

  Mutation: {

    updateFile: async (_: any, args: UpdateFileInput) => {
      const result = parseDataValidation(args, updateFileInputSchema);

      if (result === true) {
        return await updateFile(args);
      }

      return {
        ...result,
        file: null,
      };
    },

    deleteFile: async (_: any, args: DeleteFileInput) => {
      const result = parseDataValidation(args, deleteFileInputSchema);

      if (result === true) {
        return await deleteFile(args.fileId);
      }

      return result;
    },

    executeFileMerge: async (
      _: unknown,
      args: { input: ExecuteFileMergeInput },
      context: ContextWithUser
    ) => {
      const parsed = executeFileMergeInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          message: "Input validation failed",
          file: null,
          data: null,
        };
      }
      return executeFileMerge(
        parsed.data as ExecuteFileMergeInput,
        context.user.id
      );
    },
  },
};

export default resolvers;
