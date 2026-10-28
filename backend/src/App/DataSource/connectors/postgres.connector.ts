import { Client } from "pg";
import {
  IDataConnector,
  StandardColumn,
  StandardColumnType,
  StandardDataset,
} from "../interfaces/data-connector.interface";

export class PostgresConnector implements IDataConnector {
  constructor(private config: any) {}

  private createClient() {
    return new Client({
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.databaseName,
      user: this.config.username,
      password: this.config.password,
    });
  }

  async testConnection(): Promise<boolean> {
    const client = this.createClient();

    try {
      await client.connect();
      await client.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Postgres connection error:", error);
      return false;
    } finally {
      await client.end().catch(() => {});
    }
  }

 async getResources(): Promise<string[]> {
  const client = this.createClient();

  try {
    await client.connect();

    const result = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);

    return result.rows.map(
      (row) => `${row.table_schema}.${row.table_name}`
    );
  } catch (error) {
    console.error("Postgres getResources error:", error);
    throw new Error(
      "Impossible de récupérer les tables PostgreSQL"
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

  async preview(resourceName: string, limit = 100): Promise<StandardDataset> {
    const safeLimit = Math.min(Math.max(limit, 1), 1000);

    return {
      columns: [],
      rows: [],
      metadata: {
        source: "POSTGRES",
        databaseName: this.config.databaseName,
        resourceName,
        returnedRows: 0,
        columnCount: 0,
        extractedAt: new Date().toISOString(),
        limit: safeLimit,
      },
    };
  }

  async extract(
    resourceName: string,
    maxRows = 10_000
  ): Promise<StandardDataset> {
    const client = this.createClient();

    try {
      await client.connect();

      const safeMaxRows = Math.min(
        Math.max(maxRows, 1),
        100_000
      );

      const { schemaName, tableName } =
        this.parseResourceName(resourceName);

      const tableExists = await client.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = $1
              AND table_name = $2
              AND table_type = 'BASE TABLE'
          ) AS exists
        `,
        [schemaName, tableName]
      );

      if (!tableExists.rows[0]?.exists) {
        throw new Error(
          `La table "${resourceName}" n'existe pas`
        );
      }

      const query = `
        SELECT *
        FROM ${this.quoteIdentifier(schemaName)}.${this.quoteIdentifier(tableName)}
        LIMIT $1
      `;

      const result = await client.query(query, [
        safeMaxRows,
      ]);

      const rows = result.rows as Record<string, unknown>[];

      const columns: StandardColumn[] =
        result.fields.map((field) => {
          const firstDefinedValue = rows
            .map((row) => row[field.name])
            .find(
              (value) =>
                value !== null && value !== undefined
            );

          return {
            name: field.name,
            type: this.detectType(firstDefinedValue),
          };
        });

      return {
        columns,
        rows,
        metadata: {
          source: "POSTGRES",
          databaseName: this.config.databaseName,
          resourceName,
          schemaName,
          returnedRows: rows.length,
          columnCount: columns.length,
          extractedAt: new Date().toISOString(),
          maxRows: safeMaxRows,
        },
      };
    } catch (error) {
      console.error("PostgreSQL extract error:", error);

      throw new Error(
        `Impossible d'extraire la table "${resourceName}"`
      );
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private parseResourceName(resourceName: string): {
    schemaName: string;
    tableName: string;
  } {
    const parts = resourceName.split(".");

    if (parts.length === 1) {
      return {
        schemaName: "public",
        tableName: parts[0],
      };
    }

    if (parts.length === 2) {
      return {
        schemaName: parts[0],
        tableName: parts[1],
      };
    }

    throw new Error(
      `Nom de ressource PostgreSQL invalide : "${resourceName}"`
    );
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private detectType(
    value: unknown
  ): StandardColumnType {
    if (value === null || value === undefined) {
      return "unknown";
    }

    if (value instanceof Date) {
      return "date";
    }

    if (Array.isArray(value)) {
      return "array";
    }

    if (typeof value === "number") {
      return "number";
    }

    if (typeof value === "boolean") {
      return "boolean";
    }

    if (typeof value === "string") {
      return "string";
    }

    if (typeof value === "object") {
      return "object";
    }

    return "unknown";
  }
}
