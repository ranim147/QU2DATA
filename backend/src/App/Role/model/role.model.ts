import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";
import { AccessInstance } from "../../Access/model/access.model";

export interface RoleAttributes {
  id: string;
  roleName: string;
  accesses?: AccessInstance[];
  __typename?: "Role";
}
export interface RoleCreationAttributes
  extends Optional<RoleAttributes, "id"> {}
export interface RoleInstance
  extends Model<RoleAttributes, RoleCreationAttributes>,
    RoleAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Role = sequelize.define<RoleInstance>(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    roleName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Role",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_roles",
    underscored: true,
  }
);

Role.sync({ alter : false }).catch((err) => {
  console.log(err);
});
export default Role;
