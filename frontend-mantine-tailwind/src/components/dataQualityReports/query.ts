import { gql } from "@apollo/client";
import { VariableQualityMetric } from "../../types/dataQualityReports.types";

// Un rapport de qualité tel que renvoyé par le backend
export interface DataQualityReport {
  id: string;
  fileId: string;
  completeness: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  accuracy: number;
  missingValuesCount: number;
  duplicateRowsCount: number;
  outliersCount: number;
  qualityScore: number;
  variableMetrics?: VariableQualityMetric[];
  createdAt: string;
}

interface DataQualityReportResponse {
  success: boolean;
  message: string;
  report: DataQualityReport | null;
}

// ── Lecture du dernier rapport déjà généré ──
export interface GetDataQualityReportType {
  getDataQualityReport: DataQualityReportResponse;
}

export const GET_DATA_QUALITY_REPORT = gql`
  query GetDataQualityReport($fileId: ID!) {
    getDataQualityReport(fileId: $fileId) {
      success
      message
      report {
        id
        fileId
        completeness
        consistency
        validity
        uniqueness
        accuracy
        missingValuesCount
        duplicateRowsCount
        outliersCount
        qualityScore
        variableMetrics {
          featureId
          name
          label
          missingCount
          missingPercentage
          outliersCount
          score
          hasAnomaly
        }
        createdAt
      }
    }
  }
`;

// ── Génération (ou lecture depuis le cache) d'un rapport ──
export interface GenerateDataQualityReportType {
  generateDataQualityReport: DataQualityReportResponse;
}

export const GENERATE_DATA_QUALITY_REPORT = gql`
  mutation GenerateDataQualityReport($fileId: ID!) {
    generateDataQualityReport(fileId: $fileId) {
      success
      message
      report {
        id
        fileId
        completeness
        consistency
        validity
        uniqueness
        accuracy
        missingValuesCount
        duplicateRowsCount
        outliersCount
        qualityScore
        variableMetrics {
          featureId
          name
          label
          missingCount
          missingPercentage
          outliersCount
          score
          hasAnomaly
        }
        createdAt
      }
    }
  }
`;
