import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import {
  createPageInputSchema,
  deletePageInputSchema,
  getPagesInputSchema,
  updatePageInputSchema,
} from "./validators";
import {
  CreatePageInput,
  DeletePageInput,
  GetPagesInput,
  UpdatePageInput,
} from "./types";
import {
  createPage,
  deletePage,
  getPages,
  updatePage,
} from "./service";

const resolvers = {
  Query: {
    getPages: async (_: any, args: GetPagesInput) => {
      const result = parseDataValidation(args, getPagesInputSchema);

      if (result === true) {
        return await getPages(args);
      }

      return [];
    },
  },

  Mutation: {
    createPage: async (_: any, args: CreatePageInput) => {
      const result = parseDataValidation(args, createPageInputSchema);

      if (result === true) {
        return await createPage(args);
      }

      return {
        ...result,
        page: null,
      };
    },

    updatePage: async (_: any, args: UpdatePageInput) => {
      const result = parseDataValidation(args, updatePageInputSchema);

      if (result === true) {
        return await updatePage(args);
      }

      return {
        ...result,
        page: null,
      };
    },

    deletePage: async (_: any, args: DeletePageInput) => {
      const result = parseDataValidation(args, deletePageInputSchema);

      if (result === true) {
        return await deletePage(args);
      }

      return result;
    },
  },
};

export default resolvers;