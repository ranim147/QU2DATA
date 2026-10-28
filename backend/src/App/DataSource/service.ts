import { readFile } from "node:fs/promises";

import { sequelize } from "../../Config/database";
import { createFeaturesFromUpload } from "../Feature/service";
import { File } from "../File/model";
import { ConnectorFactory } from "./connectors/connector.factory";
import csvFileService from "./exporters/csv-file.service";
import {
  FastApiUploadData,
  uploadFileToFastApi,
} from "./fastapi-upload.service";
import {
  IDataConnector,
  StandardDataset,
} from "./interfaces/data-connector.interface";
import { DataSource } from "./model";
import {
  ConnectorConfig,
  CreateDataSourceInput,
  DataSourceConnectionInput,
  DataSourceType,
  ExtractDataSourceInput,
  ResourceExtractionInput,
} from "./types";
import {
  decryptCredential,
  encryptCredential,
} from "./utils/credential-crypto";

export const testConnection = async (
  input: DataSourceConnectionInput
): Promise<boolean> => {
  const connector = ConnectorFactory.create(
    input.type,
    input
  );

  return connector.testConnection();
};

/*
 * Méthode interne : récupère la connexion complète et
 * déchiffre le mot de passe.
 */
const getConnectorConfig = async (
  dataSourceId: string
): Promise<ConnectorConfig> => {
  const dataSource = await DataSource.findByPk(dataSourceId);

  if (!dataSource) {
    throw new Error(
      "Source de données introuvable"
    );
  }

  return {
    type: dataSource.type,

    host: dataSource.host,
    port: dataSource.port,
    databaseName: dataSource.databaseName,

    username: dataSource.username ?? undefined,

    password: dataSource.encryptedPassword
      ? decryptCredential(dataSource.encryptedPassword)
      : undefined,

    options: dataSource.options ?? undefined,
  };
};

const extractSelectedResources = async (
  connector: IDataConnector,
  input: ResourceExtractionInput
): Promise<StandardDataset> => {
  const resources = input.resources;
  const maxRows = Math.min(
    Math.max(input.maxRows ?? 10_000, 1),
    100_000
  );

  if (!resources || resources.length === 0) {
    throw new Error(
      "Au moins une table ou collection doit être sélectionnée"
    );
  }

  /*
   * Cas 1 : une seule table/collection.
   */
  if (resources.length === 1) {
    return connector.extract(
      resources[0].resourceName,
      maxRows
    );
  }

  /*
   * Cas 2 : plusieurs tables dans un même dataset.
   */
  if (!input.joins || input.joins.length === 0) {
    throw new Error(
      "Les relations sont obligatoires pour extraire plusieurs tables"
    );
  }

  if (!connector.extractJoined) {
    throw new Error(
      "Les extractions jointes ne sont pas disponibles pour cette source"
    );
  }

  const joinedResources = resources.map(
    (resource) => {
      const alias = resource.alias?.trim();

      if (!alias) {
        throw new Error(
          `Un alias est obligatoire pour la ressource "${resource.resourceName}" lors d'une extraction jointe`
        );
      }

      return {
        ...resource,
        alias,
      };
    }
  );

  return connector.extractJoined({
    resources: joinedResources,
    joins: input.joins,
    maxRows,
  });
};

export const createDataSource = async (
  input: CreateDataSourceInput
) => {
  const normalizedType = input.type
    .trim()
    .toUpperCase() as DataSourceType;

  if (
    !["POSTGRES", "MYSQL", "MONGODB"].includes(
      normalizedType
    )
  ) {
    throw new Error(
      `Type de source de données invalide : "${input.type}"`
    );
  }

  // 1. Tester avant d'enregistrer.
  const connected = await testConnection({
    ...input,
    type: normalizedType,
  });

  if (!connected) {
    throw new Error(
      "La connexion à la source de données a échoué"
    );
  }

  // 2. Chiffrer le mot de passe.
  const encryptedPassword = input.password
    ? encryptCredential(input.password)
    : null;

  // 3. Enregistrer une seule fois.
  return DataSource.create({
    projectId: input.projectId,
    name: input.name,
    type: normalizedType,

    host: input.host,
    port: input.port,
    databaseName: input.databaseName,

    username: input.username ?? null,
    encryptedPassword,

    options: input.options ?? null,
    status: "CONNECTED",
  });
};

export const extractDataSourceToFile = async (
  input: ExtractDataSourceInput
) => {
  const dataSource = await DataSource.findByPk(
    input.dataSourceId
  );

  if (!dataSource) {
    throw new Error(
      "Source de données introuvable"
    );
  }

  const config = await getConnectorConfig(
    dataSource.id
  );

  const connector = ConnectorFactory.create(
    config.type,
    config
  );

  const connected = await connector.testConnection();

  if (!connected) {
    await dataSource.update({
      status: "ERROR",
    });

    throw new Error(
      "Connexion impossible avec la source enregistrée"
    );
  }

  const dataset = await extractSelectedResources(
    connector,
    input
  );

  const datasetName =
    dataSource.name?.trim() ||
    `dataset-${dataSource.id}`;

  const csvResult = await csvFileService.createFile(
    datasetName,
    dataset
  );

  let uploadResult: FastApiUploadData;

  try {
    uploadResult = await uploadFileToFastApi({
      buffer: await readFile(csvResult.filePath),
      originalname: csvResult.fileName,
      mimetype: csvResult.mimeType,
      size: csvResult.sizeBytes,
    });
  } catch (error) {
    console.error("FastAPI upload failed:", error);
    throw new Error(
      "Échec de l'envoi du dataset vers FastAPI"
    );
  }

  const file = await sequelize.transaction(
    async (transaction) => {
      const createdFile = await File.create(
        {
          name: csvResult.fileName,
          type: csvResult.mimeType,
          size: csvResult.sizeBytes,

          // ID retourné par FastAPI
          minioId: uploadResult.dataset_id,

          projectId: dataSource.projectId,
          dataSourceId: dataSource.id,
        },
        { transaction }
      );

      await createFeaturesFromUpload(
        createdFile.id,
        uploadResult,
        transaction
      );

      return createdFile;
    }
  );

  return file;
};

export const listDataSources = async () => {
  return DataSource.findAll({
    order: [["createdAt", "DESC"]],
    attributes: {
      exclude: ["encryptedPassword"],
    },
  });
};

export const getDataSourceById = async (
  id: string
) => {
  const dataSource = await DataSource.findByPk(id, {
    attributes: {
      exclude: ["encryptedPassword"],
    },
  });

  if (!dataSource) {
    throw new Error(
      "Source de données introuvable"
    );
  }

  return dataSource;
};

export const testSavedDataSource = async (
  dataSourceId: string
): Promise<boolean> => {
  const config = await getConnectorConfig(dataSourceId);

  const connector = ConnectorFactory.create(
    config.type,
    config
  );

  const connected = await connector.testConnection();

  await DataSource.update(
    {
      status: connected ? "CONNECTED" : "ERROR",
    },
    {
      where: {
        id: dataSourceId,
      },
    }
  );

  return connected;
};

export const getResourcesByDataSourceId = async (
  dataSourceId: string
): Promise<string[]> => {
  const config = await getConnectorConfig(dataSourceId);

  const connector = ConnectorFactory.create(
    config.type,
    config
  );

  return connector.getResources();
};

export const previewByDataSourceId = async (
  dataSourceId: string,
  resourceName: string,
  limit = 100
): Promise<StandardDataset> => {
  const config = await getConnectorConfig(dataSourceId);

  const connector = ConnectorFactory.create(
    config.type,
    config
  );

  return connector.preview(
    resourceName,
    limit
  );
};

export const getResources = async (
  input: any
): Promise<string[]> => {
  const connector = ConnectorFactory.create(
    input.type,
    input
  );

  const connected = await connector.testConnection();

  if (!connected) {
    throw new Error(
      "Connexion impossible avec la source de données"
    );
  }

  return connector.getResources();
};

export const preview = async (
  input: any,
  resourceName: string,
  limit = 100
): Promise<StandardDataset> => {
  const connector = ConnectorFactory.create(
    input.type,
    input
  );

  const connected = await connector.testConnection();

  if (!connected) {
    throw new Error(
      "Connexion impossible avec la source de données"
    );
  }

  return connector.preview(resourceName, limit);
};

export const extract = async (
  input: any,
  resourceName: string,
  maxRows = 10_000
): Promise<StandardDataset> => {
  const connector = ConnectorFactory.create(
    input.type,
    input
  );

  const connected = await connector.testConnection();

  if (!connected) {
    throw new Error(
      "Connexion impossible avec la source de données"
    );
  }

  return connector.extract(
    resourceName,
    maxRows
  );
};

const DataSourceService = {
  testConnection,
  createDataSource,
  listDataSources,
  getDataSourceById,
  testSavedDataSource,
  getResourcesByDataSourceId,
  previewByDataSourceId,
  extractDataSourceToFile,
  getResources,
  preview,
  extract,
};

export default DataSourceService;
