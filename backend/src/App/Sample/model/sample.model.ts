import { sequelize } from "../../../Config/database";
import { DataTypes, Model, Optional } from "sequelize";

export interface SampleAttributes {
  id: string;
  name: string;
  methodName: string;
  size: number;
  fileId: string;
  isActive: boolean;
  __typename?: "Sample";
}

export interface SampleCreationAttributes
  extends Optional<SampleAttributes, "id" | "isActive"> {}

export interface SampleInstance
  extends Model<SampleAttributes, SampleCreationAttributes>,
    SampleAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Sample = sequelize.define<SampleInstance>(
  "Sample",
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
    methodName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "method_name",
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "file_id",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Sample",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_samples",
    underscored: true,
  }
);

Sample.sync({ alter : false }).catch((err) => {
  console.log(err);
});

export default Sample;