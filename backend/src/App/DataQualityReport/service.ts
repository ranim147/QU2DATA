import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { getFastApiConfig } from "../../Helpers/GeneralHelpers";
import { getFastApiToken } from "../../Helpers/ThirdPartFastApiHelper";
import { Feature, FeatureInstance } from "../Feature/model";
import { File } from "../File/model";
import { DataQualityReport } from "./model";
import { ApolloError } from "apollo-server-express";

// Ce que FastAPI nous renvoie pour UNE colonne
interface ColumnProfile {
  name: string;
  dtype: string;
  missing_count: number;
  missing_percentage: number;
}

// Ce que FastAPI nous renvoie pour TOUT le fichier
interface ProfileResult {
  rows: number;
  columns: ColumnProfile[];
}

/**
 * Appelle FastAPI pour obtenir le profil de complétude d'un fichier.
 * @param minioId - l'identifiant du dataset côté FastAPI
 * @returns le nombre de lignes du fichier + le détail des valeurs manquantes par colonne
 */
const fetchProfile = async (minioId: string): Promise<ProfileResult> => {
  const { fastApiUrl } = getFastApiConfig();
  const fastApiToken = await getFastApiToken();

  const response = await axios.get(`${fastApiUrl}/preprocessing/profile`, {
    params: { file_id: minioId },
    headers: {
      Authorization: `Bearer ${fastApiToken}`,
    },
  });

  return response.data.data;
};

// Ce que FastAPI nous renvoie pour l'analyse des doublons
interface DuplicatesResult {
  total_rows: number;
  duplicate_count: number;
  unique_rows: number;
  duplicate_rate: number;
}

/**
 * Appelle FastAPI pour savoir combien de lignes sont des doublons.
 * @param minioId - l'identifiant du dataset côté FastAPI
 * @returns le détail des doublons trouvés dans le fichier
 */
const fetchDuplicates = async (minioId: string): Promise<DuplicatesResult> => {
  const { fastApiUrl } = getFastApiConfig();
  const fastApiToken = await getFastApiToken();

  const response = await axios.get(`${fastApiUrl}/duplicates/analyze`, {
    params: { file_id: minioId },
    headers: {
      Authorization: `Bearer ${fastApiToken}`,
    },
  });

  return response.data.data;
};

/**
 * Récupère toutes les Feature d'un fichier avec leur nom, type, label.
 */
const getAllFeatures = async (fileId: string): Promise<FeatureInstance[]> => {
  return await Feature.findAll({
    where: { fileId },
    attributes: ["id", "name", "label", "type"],
  });
};

// Ce que FastAPI nous renvoie pour UNE colonne analysée
interface OutlierColumnResult {
  outlier_count: number;
}

/**
 * Appelle FastAPI pour détecter les valeurs aberrantes sur les colonnes numériques.
 * Retourne un Record colonne -> outlier_count (per-column breakdown).
 * @param minioId - l'identifiant du dataset côté FastAPI
 * @param columnNames - la liste des colonnes numériques à analyser
 * @returns Record<string, number> - nom colonne -> nb outliers
 */
const fetchOutliersPerColumn = async (
  minioId: string,
  columnNames: string[]
): Promise<Record<string, number>> => {
  if (columnNames.length === 0) {
    return {};
  }

  const { fastApiUrl } = getFastApiConfig();
  const fastApiToken = await getFastApiToken();

  const response = await axios.get(`${fastApiUrl}/outliers/detect`, {
    params: {
      dataset_id: minioId,
      method: "iqr",
      columns: columnNames.join(","),
      factor: 1.5,
    },
    headers: {
      Authorization: `Bearer ${fastApiToken}`,
    },
  });

  const results: Record<string, OutlierColumnResult> = response.data.data.results;

  const perColumn: Record<string, number> = {};
  for (const [colName, colResult] of Object.entries(results)) {
    perColumn[colName] = colResult.outlier_count;
  }

  return perColumn;
};

/**
 * Calcule la cohérence du schéma : proportion de Feature qui ont
 * un type correctement détecté, par rapport au total de Feature du fichier.
 * aucun appel FastAPI
 */
const computeConsistency = async (fileId: string): Promise<number> => {
  const allFeatures = await Feature.findAll({
    where: { fileId },
    attributes: ["type"],
  });

  if (allFeatures.length === 0) {
    return 1;
  }

  const featuresWithType = allFeatures.filter((feature) => feature.type !== null);

  return featuresWithType.length / allFeatures.length;
};

interface QualityInputs {
  totalRows: number;
  totalColumns: number;
  missingValuesCount: number;
  duplicateRowsCount: number;
  outliersCount: number;
  numericColumnsCount: number;
  consistency: number;
}

interface QualityMetrics {
  completeness: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  accuracy: number;
  qualityScore: number;
}

/**
 * Calcule les 5 dimensions de qualité et le score global
 */
const computeQualityMetrics = (inputs: QualityInputs): QualityMetrics => {
  const {
    totalRows,
    totalColumns,
    missingValuesCount,
    duplicateRowsCount,
    outliersCount,
    numericColumnsCount,
    consistency,
  } = inputs;

  const totalCells = totalRows * totalColumns;

  const completeness = totalCells > 0 ? 1 - missingValuesCount / totalCells : 1;

  const uniqueness = totalRows > 0 ? 1 - duplicateRowsCount / totalRows : 1;

  const numericCells = totalRows * numericColumnsCount;
  const validity = numericCells > 0 ? 1 - outliersCount / numericCells : 1;

  const accuracy = completeness;

  const qualityScore =
    (completeness * 0.35 +
      consistency * 0.2 +
      uniqueness * 0.2 +
      validity * 0.15 +
      accuracy * 0.1) *
    100;

  return {
    completeness,
    consistency,
    validity,
    uniqueness,
    accuracy,
    qualityScore: Math.round(qualityScore * 100) / 100,
  };
};

/**
 * Génère un rapport de qualité complet pour un fichier :
 * - une ligne "globale" (fileId rempli, featureId null)
 * - une ligne "variable" par Feature (fileId null, featureId rempli)
 * reliées entre elles par un reportGroupId commun.
 */
export const generateDataQualityReport = async (fileId: string) => {
  // Si un rapport existe déjà pour ce fichier, on le renvoie tel quel
  const existingReport = await getLatestDataQualityReport(fileId);
  if (existingReport) {
    return existingReport;
  }

  const file = await File.findByPk(fileId);
  if (!file) {
    throw new ApolloError("FILE NOT FOUND");
  }

  const [profileResult, duplicatesResult, allFeatures] = await Promise.all([
    fetchProfile(file.minioId),
    fetchDuplicates(file.minioId),
    getAllFeatures(fileId),
  ]);

  const numericFeatures = allFeatures.filter((f) => f.type === "metric");
  const numericColumnNames = numericFeatures.map((f) => f.name);

  const outliersPerColumn = await fetchOutliersPerColumn(file.minioId, numericColumnNames);
  const outliersCount = Object.values(outliersPerColumn).reduce((sum, c) => sum + c, 0);

  const consistency = await computeConsistency(fileId);

  const missingValuesCount = profileResult.columns.reduce(
    (total, column) => total + column.missing_count,
    0
  );

  const metrics = computeQualityMetrics({
    totalRows: profileResult.rows,
    totalColumns: profileResult.columns.length,
    missingValuesCount,
    duplicateRowsCount: duplicatesResult.duplicate_count,
    outliersCount,
    numericColumnsCount: numericColumnNames.length,
    consistency,
  });

  const profileMap = new Map<string, ColumnProfile>();
  for (const col of profileResult.columns) {
    profileMap.set(col.name, col);
  }

  const reportGroupId = uuidv4();

  // 1. Ligne globale (fileId rempli, featureId null)
  const globalReport = await DataQualityReport.create({
    reportGroupId,
    fileId,
    featureId: null,
    completeness: metrics.completeness,
    consistency: metrics.consistency,
    validity: metrics.validity,
    uniqueness: metrics.uniqueness,
    accuracy: metrics.accuracy,
    missingValuesCount,
    duplicateRowsCount: duplicatesResult.duplicate_count,
    outliersCount,
    qualityScore: metrics.qualityScore,
  });

  // 2. Une ligne par variable (fileId null, featureId rempli)
  const totalRows = profileResult.rows;

  const variableRows = allFeatures.map((feature) => {
    const profile = profileMap.get(feature.name);
    const missingCount = profile?.missing_count ?? 0;
    const missingPercentage = profile?.missing_percentage ?? 0;
    const colOutliers = outliersPerColumn[feature.name] ?? 0;

    const completenessScore = totalRows > 0 ? 1 - missingCount / totalRows : 1;
    const validityScore = totalRows > 0 ? 1 - colOutliers / totalRows : 1;

    let score = (completenessScore * 0.6 + validityScore * 0.4) * 100;
    score = Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;

    const hasAnomaly = missingPercentage > 10 || colOutliers > 0;

    return {
      reportGroupId,
      fileId: null,
      featureId: feature.id,
      missingValuesCount: missingCount,
      missingPercentage,
      outliersCount: colOutliers,
      qualityScore: score,
      hasAnomaly,
    };
  });

  const createdVariableRows = await DataQualityReport.bulkCreate(variableRows);

  return buildReportResponse(globalReport, createdVariableRows, allFeatures);
};

/**
 * Relit le dernier rapport déjà généré pour un fichier :
 * la ligne globale + toutes les lignes variables de la même génération
 * (identifiées par le reportGroupId commun).
 */
export const getLatestDataQualityReport = async (fileId: string) => {
  const globalReport = await DataQualityReport.findOne({
    where: { fileId },
    order: [["createdAt", "DESC"]],
  });

  if (!globalReport) {
    return null;
  }

  const variableRows = await DataQualityReport.findAll({
    where: {
      reportGroupId: globalReport.reportGroupId,
      featureId: { [Op.ne]: null },
    },
  });

  const featureIds = variableRows.map((row) => row.featureId as string);
  const features = await Feature.findAll({
    where: { id: featureIds },
    attributes: ["id", "name", "label"],
  });

  return buildReportResponse(globalReport, variableRows, features);
};

/**
 * Reconstruit la forme attendue par le schéma GraphQL
 * ({ ...rapportGlobal, variableMetrics: [...] }) à partir des
 * lignes "plates" en base (globale + variables + features associées).
 */
const buildReportResponse = (
  globalReport: any,
  variableRows: any[],
  features: FeatureInstance[]
) => {
  const featureMap = new Map(features.map((f) => [f.id, f]));

  const variableMetrics = variableRows.map((row) => {
    const feature = featureMap.get(row.featureId);
    return {
      featureId: row.featureId,
      name: feature?.name ?? "",
      label: feature?.label ?? null,
      missingCount: row.missingValuesCount ?? 0,
      missingPercentage: row.missingPercentage ?? 0,
      outliersCount: row.outliersCount ?? 0,
      score: row.qualityScore ?? 0,
      hasAnomaly: row.hasAnomaly ?? false,
    };
  });

  return {
    id: globalReport.id,
    fileId: globalReport.fileId,
    completeness: globalReport.completeness,
    consistency: globalReport.consistency,
    validity: globalReport.validity,
    uniqueness: globalReport.uniqueness,
    accuracy: globalReport.accuracy,
    missingValuesCount: globalReport.missingValuesCount,
    duplicateRowsCount: globalReport.duplicateRowsCount,
    outliersCount: globalReport.outliersCount,
    qualityScore: globalReport.qualityScore,
    variableMetrics,
    createdAt: globalReport.createdAt,
  };
};