import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../../../Config/database";
import type { WidgetTypeInstance } from "./widget-type.model";
import type { PageInstance } from "../../Page/model/page.model";

export interface WidgetAttributes {
  id: string;
  widgetTypeId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  value: Record<string, unknown>;
  pageId: string | null;
  chartTypeId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WidgetCreationAttributes
  extends Optional<
    WidgetAttributes,
    | "id"
    | "x"
    | "y"
    | "w"
    | "h"
    | "pageId"
    | "chartTypeId"
    | "createdAt"
    | "updatedAt"
  > {}

export interface WidgetInstance
  extends Model<WidgetAttributes, WidgetCreationAttributes>,
    WidgetAttributes {
  widgetType?: WidgetTypeInstance;
  page?: PageInstance;
}

const  Widget = sequelize.define<WidgetInstance>(
  "Widget",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    widgetTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    w: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    h: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    pageId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    chartTypeId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "widgets",
    timestamps: true,
  }
);

export default Widget;
