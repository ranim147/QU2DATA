import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";
import { DataSourceType } from "../types";

export type DataSourceStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

export interface DataSourceAttributes {
  id: string;
  projectId: string;
  name: string;
  type: DataSourceType;
  host: string;
  port: number;
  databaseName: string;
  username: string | null;
  encryptedPassword: string | null;
  options: Record<string, unknown> | null;
  status: DataSourceStatus;
}

export interface DataSourceCreationAttributes
  extends Optional<
    DataSourceAttributes,
    "id" | "options" | "status"
  > {}

export interface DataSourceInstance
  extends Model<
      DataSourceAttributes,
      DataSourceCreationAttributes
    >,
    DataSourceAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const DataSource = sequelize.define<DataSourceInstance>(
  "DataSource",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "POSTGRES",
        "MYSQL",
        "MONGODB"
      ),
      allowNull: false,
    },
    host: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    databaseName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "database_name",
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    encryptedPassword: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "encrypted_password",
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "CONNECTED",
        "DISCONNECTED",
        "ERROR"
      ),
      allowNull: false,
      defaultValue: "CONNECTED",
    },
  },
  {
    tableName: "v1_data_sources",
    timestamps: true,
    underscored: true,
  }
);

export default DataSource;
