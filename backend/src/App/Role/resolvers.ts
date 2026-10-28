// resolvers.ts

import { create, deleteRole, findAll, statics } from "./service";
import { createRoleInput, deleteRoleInput } from "./types";
import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import { createRoleInputSchema } from "./validators";
const resolvers = {
  Query: {
    getRoles: async () => {
      return await findAll();
    },
    getStatics: async (_, { roleID }) => {
      return statics(roleID);
    },
  },
  Mutation: {
    createRole: async (_, data: createRoleInput) => {
      const validateData = parseDataValidation(data, createRoleInputSchema);
      if (validateData === true) {
        return await create(data);
      } else {
        return {
          ...validateData,
          role: null,
        };
      }
    },
    deleteRole: async (_, data: deleteRoleInput) => {
      return await deleteRole(data);
    },
  },
};

export default resolvers;
