import * as auth from "./auth";
import * as hasPermission from "./hasPermission";
export default {
  typeDef: [auth.typeDef, hasPermission.typeDef],
  transformer: [auth.transformer, hasPermission.transformer],
};
