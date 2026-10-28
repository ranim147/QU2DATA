import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../../../Config/database";

export type WidgetTypeName = "TEXT" | "CHART";

export interface WidgetTypeAttributes {
  id: string;
  name: WidgetTypeName;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WidgetTypeCreationAttributes
  extends Optional<
    WidgetTypeAttributes,
    "id" | "description" 
  > {}

export interface WidgetTypeInstance
  extends Model<
      WidgetTypeAttributes,
      WidgetTypeCreationAttributes
    >,
    WidgetTypeAttributes {}

export const WidgetType =
  sequelize.define<WidgetTypeInstance>(
    "WidgetType",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.ENUM("TEXT", "CHART"),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "widget_types",
      timestamps: true,
    }
  );

export default WidgetType;
