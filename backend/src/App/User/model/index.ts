import { Role } from "../../Role/model";
import User from "./user.model";
User.belongsTo(Role, { foreignKey: "roleId" });

Role.hasMany(User, { foreignKey: "roleId" });
export { User };
