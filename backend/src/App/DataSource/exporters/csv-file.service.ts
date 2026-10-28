import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { StandardDataset } from "../interfaces/data-connector.interface";

export interface CsvFileResult {
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  rowCount: number;
  columnCount: number;
}

const outputDirectory = path.resolve(
  process.cwd(),
  "generated-datasets"
);

const sanitizeFileName = (fileName: string): string => {
  const sanitized = fileName
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || "dataset";
};

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  let normalizedValue: string;

  if (value instanceof Date) {
    normalizedValue = value.toISOString();
  } else if (
    Array.isArray(value) ||
    typeof value === "object"
  ) {
    normalizedValue = JSON.stringify(value);
  } else {
    normalizedValue = String(value);
  }

  const escapedValue = normalizedValue.replace(/"/g, '""');
  const needsQuotes =
    escapedValue.includes(",") ||
    escapedValue.includes('"') ||
    escapedValue.includes("\n") ||
    escapedValue.includes("\r");

  return needsQuotes ? `"${escapedValue}"` : escapedValue;
};

const convertDatasetToCsv = (
  dataset: StandardDataset
): string => {
  const columnNames = dataset.columns.map(
    (column) => column.name
  );

  if (columnNames.length === 0) {
    throw new Error(
      "Impossible de créer un CSV sans colonnes"
    );
  }

  const header = columnNames
    .map(escapeCsvValue)
    .join(",");
  const lines = dataset.rows.map((row) =>
    columnNames
      .map((columnName) =>
        escapeCsvValue(row[columnName])
      )
      .join(",")
  );

  return [header, ...lines].join("\r\n");
};

export const createFile = async (
  datasetName: string,
  dataset: StandardDataset
): Promise<CsvFileResult> => {
  await mkdir(outputDirectory, {
    recursive: true,
  });

  const safeDatasetName = sanitizeFileName(datasetName);
  const fileName = `${safeDatasetName}-${randomUUID()}.csv`;
  const filePath = path.join(outputDirectory, fileName);
  const csvContent = convertDatasetToCsv(dataset);

  // Le BOM UTF-8 permet à Excel de reconnaître les accents.
  await writeFile(filePath, `\uFEFF${csvContent}`, {
    encoding: "utf8",
  });

  const storedFile = await readFile(filePath);

  return {
    fileName,
    filePath,
    mimeType: "text/csv",
    sizeBytes: storedFile.byteLength,
    rowCount: dataset.rows.length,
    columnCount: dataset.columns.length,
  };
};

export default {
  createFile,
};
