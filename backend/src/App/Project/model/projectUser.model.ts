import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../Config/database";

export interface ProjectUserAttributes {
  id: string;
  projectId: string;
  userId: string;
  isOwner: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectUserCreationAttributes
  extends Optional<ProjectUserAttributes, "id" | "isOwner"> {}

export interface ProjectUserInstance
  extends Model<ProjectUserAttributes, ProjectUserCreationAttributes>,
    ProjectUserAttributes {}

export const ProjectUser = sequelize.define<ProjectUserInstance>(
  "ProjectUser",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "v1_project_users",
    timestamps: true,
  }
);