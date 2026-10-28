import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../Config/database";

export interface DataQualityReportAttributes {
  id: string;
  reportGroupId: string;
  fileId: string | null;
  featureId: string | null;
  // Champs globaux 
  completeness: number | null;
  consistency: number | null;
  validity: number | null;
  uniqueness: number | null;
  accuracy: number | null;
  duplicateRowsCount: number | null;
  invalidValuesCount: number | null;
  missingValuesCount: number | null; // global: total ; variable: missingCount
  outliersCount: number | null;      // global: total ; variable: par colonne
  qualityScore: number | null;       // global: score global ; variable: score de la variable
  // Champs "variable" uniquement 
  missingPercentage: number | null;
  hasAnomaly: boolean | null;
  createdAt?: Date;
}

export interface DataQualityReportCreationAttributes
  extends Optional<
    DataQualityReportAttributes,
    | "id"
    | "fileId"
    | "featureId"
    | "completeness"
    | "consistency"
    | "validity"
    | "uniqueness"
    | "accuracy"
    | "duplicateRowsCount"
    | "invalidValuesCount"
    | "missingValuesCount"
    | "outliersCount"
    | "qualityScore"
    | "missingPercentage"
    | "hasAnomaly"
  > {}

export interface DataQualityReportInstance
  extends Model<DataQualityReportAttributes, DataQualityReportCreationAttributes>,
    DataQualityReportAttributes {}

const DataQualityReport = sequelize.define<DataQualityReportInstance>(
  "DataQualityReport",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reportGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fileId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    featureId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    completeness: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    consistency: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    validity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    uniqueness: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    missingValuesCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    duplicateRowsCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    outliersCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    invalidValuesCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    qualityScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    missingPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    hasAnomaly: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    tableName: "v1_data_quality_reports",
    timestamps: true,
    updatedAt: false, 
  }
);


DataQualityReport.sync({ alter: false }).catch((err) => {
  console.log(err);
});

export default DataQualityReport;