import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../Config/database";

export type FeatureType = "metric" | "dimension" | "time" | "text" | "boolean" | "category";
export type FeatureScale = "nominal" | "ordinal" | "interval" | "ratio";

export interface FeatureAttributes {
  id: string;
  name: string;
  label: string | null;
  type: FeatureType;
  scale: FeatureScale | null;
  isVisible: boolean;
  weight: number;
  fileId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeatureCreationAttributes
  extends Optional<FeatureAttributes, "id" | "label" | "scale" | "isVisible" | "weight"> {}

export interface FeatureInstance
  extends Model<FeatureAttributes, FeatureCreationAttributes>,
    FeatureAttributes {}

export const Feature = sequelize.define<FeatureInstance>(
  "Feature",
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
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "metric",
        "dimension",
        "time",
        "text",
        "boolean",
        "category"
      ),
      allowNull: false,
    },
    scale: {
      type: DataTypes.ENUM("nominal", "ordinal", "interval", "ratio"),
      allowNull: true,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "v1_features",
    timestamps: true,
  }
);