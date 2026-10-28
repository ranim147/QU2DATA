export type DataSourceType = "POSTGRES" | "MYSQL" | "MONGODB";

export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  type: DataSourceType;
  host: string;
  port: number;
  databaseName: string;
  username: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceConnectionInput {
  type: DataSourceType;
  host: string;
  port: number;
  databaseName: string;
  username?: string;
  password?: string;
}

export interface CreateDataSourceInput extends DataSourceConnectionInput {
  projectId: string;
  name: string;
}
