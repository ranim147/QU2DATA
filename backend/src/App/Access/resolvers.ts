import { saveAccess, updateAccess } from "./service";
import { saveRoleInput, updateAccessInput } from "./type";

const resolvers = {
  Mutation: {
    saveAccess: async (_, data: saveRoleInput) => {
      return await saveAccess(data);
    },
    updateAccess: async (_, data: updateAccessInput) => {
      return await updateAccess(data);
    },
  },
};
export default resolvers;
