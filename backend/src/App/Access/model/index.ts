import { Permission } from "../../Permission/model";
import Access from "./access.model";

Permission.hasMany(Access, { foreignKey: "permissionId" });
Access.belongsTo(Permission, { foreignKey: "permissionId" });
export { Access };
