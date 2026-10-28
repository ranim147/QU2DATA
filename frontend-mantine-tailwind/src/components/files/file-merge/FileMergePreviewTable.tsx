import { Text } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppTable } from "../../../ui";
import { FileMergePreview } from "./types";

function renderCell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function FileMergePreviewTable({
  preview,
}: {
  preview: FileMergePreview;
}) {
  const { t } = useTranslation("files");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Text weight={700}>{t("merge_preview_table")}</Text>
        <Text size="xs" color="dimmed">
          {t("merge_result_rows", { count: preview.rows })}
        </Text>
      </div>
      <div className="max-h-[360px] overflow-auto rounded-xl border border-gray-200">
        <AppTable>
          <thead>
            <tr>
              {preview.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.preview.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {preview.columns.map((column) => (
                  <td key={column}>
                    <span className="block max-w-[260px] truncate">
                      {renderCell(row[column])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </AppTable>
      </div>
    </div>
  );
}
