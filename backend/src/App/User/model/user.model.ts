import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";
import { RoleInstance } from "../../Role/model/role.model";

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  isActive: boolean;
  isBanned: boolean;
  requested_token: string;
  requested_tokenAt: Date;
  user_agent: string;
  user_name: string;
  lastLogin: Date;
  roleId: string;
  Role?: RoleInstance;
  __typename?: "User";
}
export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "id" | "requested_token" | "requested_tokenAt" | "lastLogin"
  > {}
export interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const User = sequelize.define<UserInstance>(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    requested_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    requested_tokenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    user_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "User",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_users",
    underscored: true,
  }
);

User.sync({ alter : false }).catch((err) => {
  console.log(err);
});
export default User;
