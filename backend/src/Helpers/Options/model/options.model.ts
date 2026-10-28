import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../Config/database";

export interface OptionsAttributes {
  id: string;
  option_name: string;
  option_value: string;
  __typename?: "Options";
}
export interface OptionsCreationAttributes
  extends Optional<OptionsAttributes, "id"> {}
export interface OptionInstance
  extends Model<OptionsAttributes, OptionsCreationAttributes>,
    OptionsAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Options = sequelize.define<OptionInstance>(
  "Options",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    option_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    option_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    __typename: {
      type: DataTypes.VIRTUAL,
      get: () => "Options",
      set: () => {
        throw new Error("Do not try to set the `__typename` value!");
      },
    },
  },
  {
    tableName: "v1_options",
    underscored: true,
  }
);
Options.sync({ alter : false }).catch((err) => {
  console.log(err);
});
export default Options;
