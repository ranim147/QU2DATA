import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";

export type TransformationStatus =
  | "PENDING"
  | "PREVIEWED"
  | "APPLIED"
  | "CANCELLED"
  | "FAILED";

export interface TransformationAttributes {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  status: TransformationStatus;
  errorMessage: string | null;
  fileId: string;
  __typename?: "Transformation";
}

export interface TransformationCreationAttributes
  extends Optional<
    TransformationAttributes,
    "id" | "status" | "errorMessage"
  > {}

export interface TransformationInstance
  extends Model<TransformationAttributes, TransformationCreationAttributes>,
    TransformationAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Transformation = sequelize.define<TransformationInstance>(
  "Transformation",
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
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "PREVIEWED",
        "APPLIED",
        "CANCELLED",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
    },
    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "file_id",
      references: {
        model: "v1_files",
        key: "id",
      },
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Transformation",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_transformations",
    underscored: true,
  }
);

Transformation.sync({ alter: false }).catch((err) => {
  console.log(err);
});

export default Transformation;
