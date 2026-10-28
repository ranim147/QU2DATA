import {
  Db,
  Document,
  MongoClient,
  ObjectId,
} from "mongodb";
import {
  IDataConnector,
  JoinedExtractionInput,
  StandardColumn,
  StandardColumnType,
  StandardDataset,
} from "../interfaces/data-connector.interface";

interface MongoConnectorConfig {
  host: string;
  port?: number;
  databaseName: string;
  username?: string;
  password?: string;
}

export class MongoDBConnector implements IDataConnector {
  constructor(private readonly config: MongoConnectorConfig) {}

  private createConnectionString(): string {
    const host = this.config.host;
    const port = this.config.port ?? 27017;

    if (this.config.username && this.config.password) {
      const username = encodeURIComponent(this.config.username);
      const password = encodeURIComponent(this.config.password);

      return `mongodb://${username}:${password}@${host}:${port}/?authSource=admin`;
    }

    return `mongodb://${host}:${port}`;
  }

  private createClient(): MongoClient {
    return new MongoClient(this.createConnectionString(), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  }

  private getDatabase(client: MongoClient): Db {
    return client.db(this.config.databaseName);
  }

  async testConnection(): Promise<boolean> {
    const client = this.createClient();

    try {
      await client.connect();

      const db = this.getDatabase(client);

      await db.command({ ping: 1 });

      return true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      return false;
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  async getResources(): Promise<string[]> {
    const client = this.createClient();

    try {
      await client.connect();

      const db = this.getDatabase(client);

      const collections = await db
        .listCollections({}, { nameOnly: true })
        .toArray();

      return collections
        .map((collection) => collection.name)
        .sort((first, second) => first.localeCompare(second));
    } catch (error) {
      console.error("MongoDB getResources error:", error);

      throw new Error(
        `Impossible de récupérer les collections de la base ${this.config.databaseName}`
      );
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  async preview(
    resourceName: string,
    limit = 100
  ): Promise<StandardDataset> {
    const client = this.createClient();

    try {
      await client.connect();

      const db = this.getDatabase(client);

      const safeLimit = Math.min(Math.max(limit, 1), 1000);

      const documents = await db
        .collection(resourceName)
        .find({})
        .limit(safeLimit)
        .toArray();

      const rows = documents.map((document) =>
        this.flattenDocument(document as Record<string, unknown>)
      );

      const columns = this.detectColumns(rows);

      return {
        columns,
        rows,
        metadata: {
          source: "MONGODB",
          databaseName: this.config.databaseName,
          resourceName,
          returnedRows: rows.length,
          columnCount: columns.length,
          extractedAt: new Date().toISOString(),
          limit: safeLimit,
        },
      };
    } catch (error) {
      console.error("MongoDB preview error:", error);

      throw new Error(
        `Impossible de prévisualiser la collection ${resourceName}`
      );
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  async extract(
    resourceName: string,
    maxRows = 10_000
  ): Promise<StandardDataset> {
    const client = this.createClient();

    try {
      await client.connect();

      const database = this.getDatabase(client);

      const safeMaxRows = Math.min(
        Math.max(maxRows, 1),
        100_000
      );

      const collectionExists = await database
        .listCollections(
          { name: resourceName },
          { nameOnly: true }
        )
        .hasNext();

      if (!collectionExists) {
        throw new Error(
          `La collection "${resourceName}" n'existe pas`
        );
      }

      const documents = await database
        .collection(resourceName)
        .find({})
        .limit(safeMaxRows)
        .toArray();

      const rows = documents.map((document) =>
        this.flattenDocument(
          document as Record<string, unknown>
        )
      );

      const columns = this.detectColumns(rows);

      return {
        columns,
        rows,
        metadata: {
          source: "MONGODB",
          databaseName: this.config.databaseName,
          resourceName,
          returnedRows: rows.length,
          columnCount: columns.length,
          extractedAt: new Date().toISOString(),
          maxRows: safeMaxRows,
        },
      };
    } catch (error) {
      console.error("MongoDB extract error:", error);

      throw new Error(
        `Impossible d'extraire la collection "${resourceName}"`
      );
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  async extractJoined(
    input: JoinedExtractionInput
  ): Promise<StandardDataset> {
    const client = this.createClient();

    try {
      await client.connect();

      const database = this.getDatabase(client);
      const resources = input.resources;
      const joins = input.joins;
      const safeMaxRows = Math.min(
        Math.max(input.maxRows ?? 10_000, 1),
        100_000
      );

      if (resources.length < 2) {
        throw new Error(
          "Au moins deux collections sont nécessaires pour une extraction jointe"
        );
      }

      const resourceByAlias = new Map(
        resources.map((resource) => [
          resource.alias,
          resource,
        ])
      );

      if (resourceByAlias.size !== resources.length) {
        throw new Error(
          "Chaque collection doit avoir un alias unique"
        );
      }

      for (const resource of resources) {
        if (!this.isValidAlias(resource.alias)) {
          throw new Error(
            `Alias MongoDB invalide : "${resource.alias}"`
          );
        }
      }

      const existingCollections = new Set(
        (
          await database
            .listCollections({}, { nameOnly: true })
            .toArray()
        ).map((collection) => collection.name)
      );

      for (const resource of resources) {
        if (!existingCollections.has(resource.resourceName)) {
          throw new Error(
            `La collection "${resource.resourceName}" n'existe pas`
          );
        }
      }

      const primaryResource = resources[0];
      const availableAliases = new Set<string>([
        primaryResource.alias,
      ]);
      const joinedAliases = new Set<string>();
      const pipeline: Document[] = [];

      for (const join of joins) {
        if (join.type === "RIGHT") {
          throw new Error(
            "Les jointures RIGHT ne sont pas supportées par MongoDB"
          );
        }

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
            `La collection "${join.rightAlias}" est déjà jointe`
          );
        }

        if (
          !this.isValidFieldPath(join.leftColumn) ||
          !this.isValidFieldPath(join.rightColumn)
        ) {
          throw new Error(
            "Un champ de jointure MongoDB est invalide"
          );
        }

        const localField =
          join.leftAlias === primaryResource.alias
            ? join.leftColumn
            : `${join.leftAlias}.${join.leftColumn}`;

        pipeline.push({
          $lookup: {
            from: rightResource.resourceName,
            localField,
            foreignField: join.rightColumn,
            as: join.rightAlias,
          },
        });

        pipeline.push({
          $unwind: {
            path: `$${join.rightAlias}`,
            preserveNullAndEmptyArrays:
              join.type === "LEFT",
          },
        });

        availableAliases.add(join.rightAlias);
        joinedAliases.add(join.rightAlias);
      }

      const missingAliases = resources
        .slice(1)
        .map((resource) => resource.alias)
        .filter((alias) => !joinedAliases.has(alias));

      if (missingAliases.length > 0) {
        throw new Error(
          `Collections sans relation : ${missingAliases.join(", ")}`
        );
      }

      pipeline.push({ $limit: safeMaxRows });

      const documents = await database
        .collection(primaryResource.resourceName)
        .aggregate(pipeline)
        .toArray();

      const rows = documents.map((document) => {
        const primaryDocument: Record<string, unknown> = {};
        const aliasedDocument: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(document)) {
          if (joinedAliases.has(key)) {
            aliasedDocument[key] = value;
          } else {
            primaryDocument[key] = value;
          }
        }

        aliasedDocument[primaryResource.alias] =
          primaryDocument;

        return this.flattenDocument(aliasedDocument);
      });

      const columns = this.detectColumns(rows);
      const resourceNames = resources.map(
        (resource) => resource.resourceName
      );

      return {
        columns,
        rows,
        metadata: {
          source: "MONGODB",
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
      console.error("MongoDB joined extract error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Erreur MongoDB inconnue";

      throw new Error(
        `Impossible d'extraire les collections jointes : ${message}`
      );
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  private isValidAlias(alias: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias);
  }

  private isValidFieldPath(fieldPath: string): boolean {
    return fieldPath
      .split(".")
      .every(
        (part) =>
          part.length > 0 &&
          !part.startsWith("$") &&
          !part.includes("\0")
      );
  }

  private flattenDocument(
    document: Record<string, unknown>,
    prefix = "",
    result: Record<string, unknown> = {}
  ): Record<string, unknown> {
    for (const [key, value] of Object.entries(document)) {
      const columnName = prefix ? `${prefix}.${key}` : key;

      if (value instanceof ObjectId) {
        result[columnName] = value.toHexString();
        continue;
      }

      if (value instanceof Date) {
        result[columnName] = value.toISOString();
        continue;
      }

      if (Array.isArray(value)) {
        result[columnName] = value.map((item) =>
          this.normalizeValue(item)
        );
        continue;
      }

      if (
        value !== null &&
        typeof value === "object" &&
        value.constructor === Object
      ) {
        this.flattenDocument(
          value as Record<string, unknown>,
          columnName,
          result
        );

        continue;
      }

      result[columnName] = this.normalizeValue(value);
    }

    return result;
  }

  private normalizeValue(value: unknown): unknown {
    if (value instanceof ObjectId) {
      return value.toHexString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeValue(item));
    }

    if (
      value !== null &&
      typeof value === "object" &&
      value.constructor === Object
    ) {
      const normalizedObject: Record<string, unknown> = {};

      for (const [key, nestedValue] of Object.entries(value)) {
        normalizedObject[key] = this.normalizeValue(nestedValue);
      }

      return normalizedObject;
    }

    return value;
  }

  private detectColumns(
    rows: Record<string, unknown>[]
  ): StandardColumn[] {
    const columnNames = new Set<string>();

    for (const row of rows) {
      for (const key of Object.keys(row)) {
        columnNames.add(key);
      }
    }

    return Array.from(columnNames).map((name) => {
      const firstDefinedValue = rows
        .map((row) => row[name])
        .find((value) => value !== null && value !== undefined);

      return {
        name,
        type: this.detectType(firstDefinedValue),
      };
    });
  }

  private detectType(value: unknown): StandardColumnType {
    if (value === null || value === undefined) {
      return "unknown";
    }

    if (value instanceof ObjectId) {
      return "string";
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
