import { IDataConnector } from "../interfaces/data-connector.interface";
import { MySqlConnector } from "./mysql.connector";
import { MongoDBConnector } from "./mongodb.connector";
import { PostgresConnector } from "./postgres.connector";

export const createConnector = (
  type: string,
  config: any
): IDataConnector => {
  if (!type || typeof type !== "string") {
    throw new Error("Connector type is required");
  }

  const normalizedType = type.trim().toUpperCase();

  switch (normalizedType) {
    case "POSTGRES":
      return new PostgresConnector(config);

    case "MONGODB":
      return new MongoDBConnector(config);

    case "MYSQL":
      return new MySqlConnector(config);

    default:
      throw new Error(
        `Connector ${normalizedType} not supported yet`
      );
  }
};

export const ConnectorFactory = {
  create: createConnector,
};
