import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";

export interface FileAttributes {
  id: string;
  name: string;
  type: string;
  size: number;
  minioId: string;
  projectId: string;
  dataSourceId: string | null;
  __typename?: "File";
}

export interface FileCreationAttributes
  extends Optional<FileAttributes, "id" | "dataSourceId"> {}

export interface FileInstance
  extends Model<FileAttributes, FileCreationAttributes>,
    FileAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const File = sequelize.define<FileInstance>(
  "File",
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
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    minioId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "v1_projects",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    dataSourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "v1_data_sources",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "File",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_files",
    underscored: true,
  }
);

File.sync({ alter : false }).catch((err) => {
  console.log(err);
});

export default File;
