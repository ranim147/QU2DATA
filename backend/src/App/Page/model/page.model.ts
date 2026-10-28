import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";
import { PAGE_FORMAT_VALUES, DEFAULT_PAGE_FORMAT } from "../constants";

export interface PageAttributes {
  id: string;
  title: string;
  format: string;
  width: number;
  height: number;
  orderIndex: number;
  projectId: string;
  __typename?: "Page";
}

export interface PageCreationAttributes
  extends Optional<PageAttributes, "id" | "format" | "width" | "height" | "orderIndex"> {}

export interface PageInstance
  extends Model<PageAttributes, PageCreationAttributes>,
    PageAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Page = sequelize.define<PageInstance>(
  "Page",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Nouvelle page",
    },
    format: {
      type: DataTypes.ENUM(...PAGE_FORMAT_VALUES),
      allowNull: false,
      defaultValue: DEFAULT_PAGE_FORMAT,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1280,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 720,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "v1_projects",
        key: "id",
      },
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Page",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_pages",
    underscored: true,
  }
);

Page.sync({ alter : false }).catch((err) => {
  console.log(err);
});

export default Page;