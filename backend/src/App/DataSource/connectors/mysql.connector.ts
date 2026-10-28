import {
  Connection,
  FieldPacket,
  RowDataPacket,
  createConnection,
} from "mysql2/promise";
import {
  IDataConnector,
  JoinedExtractionInput,
  StandardColumn,
  StandardColumnType,
  StandardDataset,
} from "../interfaces/data-connector.interface";

interface MySqlConnectorConfig {
  host: string;
  port?: number;
  databaseName: string;
  username?: string;
  password?: string;
}

interface ParsedResource {
  databaseName: string;
  tableName: string;
}

export class MySqlConnector implements IDataConnector {
  constructor(
    private readonly config: MySqlConnectorConfig
  ) {}

  private createClient(): Promise<Connection> {
    return createConnection({
      host: this.config.host,
      port: this.config.port ?? 3306,
      database: this.config.databaseName,
      user: this.config.username,
      password: this.config.password,
      connectTimeout: 5000,
    });
  }

  async testConnection(): Promise<boolean> {
    let client: Connection | undefined;

    try {
      client = await this.createClient();
      await client.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("MySQL connection error:", error);
      return false;
    } finally {
      await client?.end().catch(() => undefined);
    }
  }

  async getResources(): Promise<string[]> {
    let client: Connection | undefined;

    try {
      client = await this.createClient();

      const [rows] = await client.query<RowDataPacket[]>(
        `
          SELECT TABLE_NAME AS tableName
          FROM information_schema.tables
          WHERE TABLE_SCHEMA = ?
            AND TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME
        `,
        [this.config.databaseName]
      );

      return rows.map((row) => String(row.tableName));
    } catch (error) {
      console.error("MySQL getResources error:", error);
      throw new Error(
        `Impossible de récupérer les tables MySQL de la base ${this.config.databaseName}`
      );
    } finally {
      await client?.end().catch(() => undefined);
    }
  }

  async preview(
    resourceName: string,
    limit = 100
  ): Promise<StandardDataset> {
    const safeLimit = Math.min(
      Math.max(limit, 1),
      1000
    );

    const dataset = await this.extractTable(
      resourceName,
      safeLimit,
      "preview"
    );

    return {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        limit: safeLimit,
      },
    };
  }

  async extract(
    resourceName: string,
    maxRows = 10_000
  ): Promise<StandardDataset> {
    const safeMaxRows = Math.min(
      Math.max(maxRows, 1),
      100_000
    );

    return this.extractTable(
      resourceName,
      safeMaxRows,
      "extract"
    );
  }

  async extractJoined(
    input: JoinedExtractionInput
  ): Promise<StandardDataset> {
    let client: Connection | undefined;

    try {
      client = await this.createClient();

      const resources = input.resources;
      const joins = input.joins;
      const safeMaxRows = Math.min(
        Math.max(input.maxRows ?? 10_000, 1),
        100_000
      );

      if (resources.length < 2) {
        throw new Error(
          "Au moins deux tables sont nécessaires pour une extraction jointe"
        );
      }

      const resourceByAlias = new Map(
        resources.map((resource) => [
          resource.alias,
          {
            ...resource,
            parsed: this.parseResourceName(
              resource.resourceName
            ),
          },
        ])
      );

      if (resourceByAlias.size !== resources.length) {
        throw new Error(
          "Chaque table doit avoir un alias unique"
        );
      }

      for (const resource of resources) {
        if (!this.isValidAlias(resource.alias)) {
          throw new Error(
            `Alias MySQL invalide : "${resource.alias}"`
          );
        }
      }

      const columnsByAlias = new Map<string, string[]>();

      for (const resource of resources) {
        const parsed = this.parseResourceName(
          resource.resourceName
        );
        const columns = await this.getTableColumns(
          client,
          parsed
        );

        if (columns.length === 0) {
          throw new Error(
            `La table "${resource.resourceName}" n'existe pas`
          );
        }

        columnsByAlias.set(resource.alias, columns);
      }

      const primaryResource = resources[0];
      const primaryParsed = this.parseResourceName(
        primaryResource.resourceName
      );
      const availableAliases = new Set<string>([
        primaryResource.alias,
      ]);
      const joinedAliases = new Set<string>();

      let fromClause = `${this.quoteIdentifier(
        primaryParsed.databaseName
      )}.${this.quoteIdentifier(
        primaryParsed.tableName
      )} AS ${this.quoteIdentifier(
        primaryResource.alias
      )}`;

      for (const join of joins) {
        if (!availableAliases.has(join.leftAlias)) {
          throw new Error(
            `L'alias gauche "${join.leftAlias}" n'est pas encore disponible dans la jointure`
          );
        }

        const rightResource = resourceByAlias.get(
          join.rightAlias
        );

        if (!rightResource) {
          throw new Error(
            `Alias droit inconnu : "${join.rightAlias}"`
          );
        }

        if (availableAliases.has(join.rightAlias)) {
          throw new Error(
            `La table "${join.rightAlias}" est déjà jointe`
          );
        }

        const leftColumns =
          columnsByAlias.get(join.leftAlias) ?? [];
        const rightColumns =
          columnsByAlias.get(join.rightAlias) ?? [];

        if (!leftColumns.includes(join.leftColumn)) {
          throw new Error(
            `La colonne "${join.leftAlias}.${join.leftColumn}" n'existe pas`
          );
        }

        if (!rightColumns.includes(join.rightColumn)) {
          throw new Error(
            `La colonne "${join.rightAlias}.${join.rightColumn}" n'existe pas`
          );
        }

        const joinType = this.getJoinType(join.type);
        const rightParsed = rightResource.parsed;

        fromClause += ` ${joinType} JOIN ${this.quoteIdentifier(
          rightParsed.databaseName
        )}.${this.quoteIdentifier(
          rightParsed.tableName
        )} AS ${this.quoteIdentifier(
          join.rightAlias
        )} ON ${this.quoteIdentifier(
          join.leftAlias
        )}.${this.quoteIdentifier(
          join.leftColumn
        )} = ${this.quoteIdentifier(
          join.rightAlias
        )}.${this.quoteIdentifier(join.rightColumn)}`;

        availableAliases.add(join.rightAlias);
        joinedAliases.add(join.rightAlias);
      }

      const missingAliases = resources
        .slice(1)
        .map((resource) => resource.alias)
        .filter((alias) => !joinedAliases.has(alias));

      if (missingAliases.length > 0) {
        throw new Error(
          `Tables sans relation : ${missingAliases.join(", ")}`
        );
      }

      const selectColumns = resources.flatMap(
        (resource) =>
          (columnsByAlias.get(resource.alias) ?? []).map(
            (column) =>
              `${this.quoteIdentifier(
                resource.alias
              )}.${this.quoteIdentifier(
                column
              )} AS ${this.quoteIdentifier(
                `${resource.alias}.${column}`
              )}`
          )
      );

      const query = `
        SELECT ${selectColumns.join(", ")}
        FROM ${fromClause}
        LIMIT ?
      `;

      const [resultRows, fields] =
        await client.query<RowDataPacket[]>(query, [
          safeMaxRows,
        ]);

      const rows = resultRows.map((row) =>
        this.normalizeRow(row)
      );
      const columns = this.detectColumns(rows, fields);
      const resourceNames = resources.map(
        (resource) => resource.resourceName
      );

      return {
        columns,
        rows,
        metadata: {
          source: "MYSQL",
          databaseName: this.config.databaseName,
          resourceName: resourceNames.join(","),
          resourceNames,
          returnedRows: rows.length,
          columnCount: columns.length,
          extractedAt: new Date().toISOString(),
          maxRows: safeMaxRows,
          joined: true,
        },
      };
    } catch (error) {
      console.error("MySQL joined extract error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Erreur MySQL inconnue";

      throw new Error(
        `Impossible d'extraire les tables jointes : ${message}`
      );
    } finally {
      await client?.end().catch(() => undefined);
    }
  }

  private async extractTable(
    resourceName: string,
    maxRows: number,
    operation: "preview" | "extract"
  ): Promise<StandardDataset> {
    let client: Connection | undefined;

    try {
      client = await this.createClient();
      const parsed = this.parseResourceName(resourceName);
      const tableColumns = await this.getTableColumns(
        client,
        parsed
      );

      if (tableColumns.length === 0) {
        throw new Error(
          `La table "${resourceName}" n'existe pas`
        );
      }

      const query = `
        SELECT *
        FROM ${this.quoteIdentifier(
          parsed.databaseName
        )}.${this.quoteIdentifier(parsed.tableName)}
        LIMIT ?
      `;

      const [resultRows, fields] =
        await client.query<RowDataPacket[]>(query, [
          maxRows,
        ]);

      const rows = resultRows.map((row) =>
        this.normalizeRow(row)
      );
      const columns = this.detectColumns(rows, fields);

      return {
        columns,
        rows,
        metadata: {
          source: "MYSQL",
          databaseName: parsed.databaseName,
          resourceName,
          returnedRows: rows.length,
          columnCount: columns.length,
          extractedAt: new Date().toISOString(),
          maxRows,
        },
      };
    } catch (error) {
      console.error(`MySQL ${operation} error:`, error);
      throw new Error(
        operation === "preview"
          ? `Impossible de prévisualiser la table "${resourceName}"`
          : `Impossible d'extraire la table "${resourceName}"`
      );
    } finally {
      await client?.end().catch(() => undefined);
    }
  }

  private async getTableColumns(
    client: Connection,
    resource: ParsedResource
  ): Promise<string[]> {
    const [rows] = await client.query<RowDataPacket[]>(
      `
        SELECT COLUMN_NAME AS columnName
        FROM information_schema.columns
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `,
      [resource.databaseName, resource.tableName]
    );

    return rows.map((row) => String(row.columnName));
  }

  private parseResourceName(
    resourceName: string
  ): ParsedResource {
    const parts = resourceName.split(".");

    if (parts.length === 1 && parts[0]) {
      return {
        databaseName: this.config.databaseName,
        tableName: parts[0],
      };
    }

    if (parts.length === 2 && parts[0] && parts[1]) {
      if (parts[0] !== this.config.databaseName) {
        throw new Error(
          `La table "${resourceName}" n'appartient pas à la base configurée`
        );
      }

      return {
        databaseName: parts[0],
        tableName: parts[1],
      };
    }

    throw new Error(
      `Nom de ressource MySQL invalide : "${resourceName}"`
    );
  }

  private quoteIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, "``")}\``;
  }

  private isValidAlias(alias: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias);
  }

  private getJoinType(type: string): string {
    switch (type) {
      case "INNER":
        return "INNER";
      case "LEFT":
        return "LEFT";
      case "RIGHT":
        return "RIGHT";
      default:
        throw new Error(
          `Type de jointure MySQL invalide : "${type}"`
        );
    }
  }

  private normalizeRow(
    row: RowDataPacket
  ): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) {
        normalized[key] = value.toISOString();
      } else if (Buffer.isBuffer(value)) {
        normalized[key] = value.toString("base64");
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  private detectColumns(
    rows: Record<string, unknown>[],
    fields: FieldPacket[]
  ): StandardColumn[] {
    return fields.map((field) => {
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
