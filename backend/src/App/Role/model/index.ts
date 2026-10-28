import { Access } from "../../Access/model";
import Role from "./role.model";

Role.hasMany(Access, { foreignKey: "roleId", as: "accesses" });
Access.belongsTo(Role, { foreignKey: "roleId" });
export { Role };
