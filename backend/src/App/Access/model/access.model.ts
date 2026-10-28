import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";
import { PermissionInstance } from "../../Permission/model/permission.model";
import { RoleInstance } from "../../Role/model/role.model";

export interface AccessAttributes {
  id: string;
  permissionId: string;
  roleId: string;
  isFullAccess: boolean;
  can_create: boolean;
  can_delete: boolean;
  can_update: boolean;
  can_show: boolean;
  can_show_own: boolean;
  Permission?: PermissionInstance;
  Role?: RoleInstance;
  __typename?: "Access";
}
export interface AccessCreationAttributes
  extends Optional<AccessAttributes, "id"> {}
export interface AccessInstance
  extends Model<AccessAttributes, AccessCreationAttributes>,
    AccessAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Access = sequelize.define<AccessInstance>(
  "Access",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    can_create: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    can_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    can_update: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    can_show: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    can_show_own: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isFullAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Access",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_access",
    underscored: true,
  }
);
Access.sync({ alter : false }).catch((err) => {
  console.log(err);
});
export default Access;
