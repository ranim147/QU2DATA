import { Text } from "@mantine/core";
import { AppTable, Card } from "../../ui";
import { DatasetResult } from "./types";

interface Props {
  title: string;
  dataset: DatasetResult;
  comparison?: DatasetResult | null;
  tone?: "before" | "after";
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function cellsDiffer(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

export default function DatasetTable({
  title,
  dataset,
  comparison,
  tone = "before",
}: Props) {
  const rows = dataset.data.slice(0, 10);

  return (
    <Card padding={false} className="min-w-0">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <Text weight={700}>{title}</Text>
          <Text size="xs" color="dimmed">
            {dataset.rowCount ?? dataset.rows} lignes au total · {rows.length} affichées
          </Text>
        </div>
      </div>

      <div className="overflow-x-auto">
        <AppTable>
          <thead>
            <tr>
              <th>#</th>
              {dataset.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={dataset.columns.length + 1}>
                  <Text size="sm" color="dimmed" align="center" py="md">
                    Aucune ligne à afficher
                  </Text>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="whitespace-nowrap text-xs text-gray-400">
                    {rowIndex + 1}
                  </td>
                  {dataset.columns.map((column) => {
                    const changed = comparison
                      ? cellsDiffer(row[column], comparison.data[rowIndex]?.[column])
                      : false;

                    return (
                      <td
                        key={column}
                        className="whitespace-nowrap"
                        style={
                          changed
                            ? {
                                backgroundColor:
                                  tone === "after" ? "#f0fdf4" : "#fff7ed",
                                color: tone === "after" ? "#166534" : "#9a3412",
                                fontWeight: 600,
                              }
                            : undefined
                        }
                      >
                        {formatCell(row[column])}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </AppTable>
      </div>
    </Card>
  );
}

