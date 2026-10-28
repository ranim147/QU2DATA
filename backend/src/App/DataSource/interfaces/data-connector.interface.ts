import {
  DataSourceJoinInput,
  DataSourceResourceInput,
} from "../types";

export type StandardColumnType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "object"
  | "array"
  | "unknown";

export interface StandardColumn {
  name: string;
  type: StandardColumnType;
}

export interface StandardDatasetMetadata {
  source: string;
  databaseName?: string;

  /*
   * Extraction d'une seule ressource.
   */
  resourceName: string;

  /*
   * Extraction jointe de plusieurs ressources.
   */
  resourceNames?: string[];

  returnedRows: number;
  columnCount: number;
  extractedAt: string;

  [key: string]: unknown;
}

export interface StandardDataset {
  columns: StandardColumn[];
  rows: Record<string, unknown>[];
  metadata: StandardDatasetMetadata;
}

export interface JoinedExtractionInput {
  resources: Array<
    DataSourceResourceInput & { alias: string }
  >;
  joins: DataSourceJoinInput[];
  maxRows?: number;
}

export interface IDataConnector {
  testConnection(): Promise<boolean>;

  getResources(): Promise<string[]>;

  preview(
    resourceName: string,
    limit?: number
  ): Promise<StandardDataset>;

  /*
   * Extraction d'une table ou collection.
   */
  extract(
    resourceName: string,
    maxRows?: number
  ): Promise<StandardDataset>;

  /*
   * Extraction optionnelle de plusieurs ressources.
   * Implémentée par les connecteurs qui supportent les jointures.
   */
  extractJoined?(
    input: JoinedExtractionInput
  ): Promise<StandardDataset>;
}
