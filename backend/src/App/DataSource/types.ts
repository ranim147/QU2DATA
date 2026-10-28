export type DataSourceType =
  | "POSTGRES"
  | "MYSQL"
  | "MONGODB";

export interface DataSourceConnectionInput {
  type: DataSourceType;
  host: string;
  port: number;
  databaseName: string;
  username?: string;
  password?: string;
  options?: Record<string, unknown>;
}

export interface DataSourceResourceInput {
  resourceName: string;
  alias?: string;
}

export type DataSourceJoinType =
  | "INNER"
  | "LEFT"
  | "RIGHT";

export interface DataSourceJoinInput {
  type: DataSourceJoinType;

  leftAlias: string;
  leftColumn: string;

  rightAlias: string;
  rightColumn: string;
}

export interface CreateDataSourceInput
  extends DataSourceConnectionInput {
  projectId: string;
  name: string;
}

export interface ResourceExtractionInput {
  resources: DataSourceResourceInput[];
  joins?: DataSourceJoinInput[];
  maxRows?: number;
}

export interface ExtractDataSourceInput
  extends ResourceExtractionInput {
  dataSourceId: string;
}

export interface ConnectorConfig
  extends DataSourceConnectionInput {}
