import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../Config/database";

export interface ProjectAttributes {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  objective: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "id" | "description" | "domain" | "objective"> { }

export interface ProjectInstance
  extends Model<ProjectAttributes, ProjectCreationAttributes>,
  ProjectAttributes { }

const Project = sequelize.define<ProjectInstance>(
  "Project",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    objective: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "v1_projects",
    timestamps: true,
  }
);
Project.sync({ alter: false }).catch((err) => {
  console.log(err);
});
export default Project;
