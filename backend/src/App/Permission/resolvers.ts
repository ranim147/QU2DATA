// resolvers.ts

import { ContextWithUser } from "../../Directives/auth";
import { findAll, getPermissionForRole } from "./service";
import { getPermissionsForRoleInput } from "./type";
const resolvers = {
  Query: {
    getPermissions: async (_: any, args: any, context: ContextWithUser) => {
      return await findAll();
    },
    getPermissionsDataForRole: async (
      _any,
      args: getPermissionsForRoleInput
    ) => {
      return await getPermissionForRole(args);
    },
  },
};

export default resolvers;
