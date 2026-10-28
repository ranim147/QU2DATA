import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";

export interface PermissionAttributes {
  id: string;
  name: string;
  flag: string;
  __typename?: "Permission";
}
export interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "id"> {}
export interface PermissionInstance
  extends Model<PermissionAttributes, PermissionCreationAttributes>,
    PermissionAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Permission = sequelize.define<PermissionInstance>(
  "Permission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    flag: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Permission",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_permissions",
    underscored: true,
  }
);
Permission.sync({ alter : false }).catch((err) => {
  console.log(err);
});
export default Permission;
