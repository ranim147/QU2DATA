import { Alert, Table, Text } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { Card } from "../../ui";
import { SamplingMethod, SamplingResult } from "./types";

const display = (value: unknown) =>
  value === null || value === undefined
    ? "—"
    : typeof value === "object"
    ? JSON.stringify(value)
    : String(value);

export default function SamplingResultView({
  method,
  result,
}: {
  method: SamplingMethod;
  result: SamplingResult;
}) {
  const { t } = useTranslation("sampling");
  const preview = result.preview;
  const columns = preview[0] ? Object.keys(preview[0]) : [];
  const stats: Array<[string, unknown]> = [];
  if ("totalRows" in result) stats.push([t("result.totalRows"), result.totalRows], [t("result.sampleSize"), result.sampleSize], [t("result.seed"), result.seed], [t("result.confidence"), `${result.confidence}%`]);
  if ("rowsOriginal" in result) stats.push([t("result.totalRows"), result.rowsOriginal], [t("result.sampleSize"), result.rowsSampled], [t("result.margin"), result.marginOfError], [t("result.confidence"), `${result.confidenceLevel}%`]);
  if ("k" in result) stats.push(["k", result.k], [t("result.offset"), result.offset]);
  if ("modalities" in result) stats.push([t("result.strata"), result.modalities.length]);
  return <Card><div className="space-y-5"><div><Text weight={700} size="lg">{t("result.title")}</Text><Text size="sm" color="dimmed">{t(`methods.${method}.title`)}</Text></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([label,value])=><div key={label} className="rounded-lg bg-gray-50 p-3"><Text size="xs" color="dimmed">{label}</Text><Text weight={700}>{display(value)}</Text></div>)}</div>{"quotaResults" in result&&<div><Text weight={600}>{t("result.quotas")}</Text>{result.quotaResults.map((quota,index)=><Text key={index} size="sm">{display(quota.values)} · {quota.selected}/{quota.requested}</Text>)}</div>}<div><Text weight={600} mb="xs">{t("result.preview")}</Text>{preview.length===0?<Alert color="blue">{t("result.noPreview")}</Alert>:<div className="overflow-x-auto"><Table striped highlightOnHover><thead><tr>{columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{preview.map((row,index)=><tr key={index}>{columns.map(column=><td key={column}>{display(row[column])}</td>)}</tr>)}</tbody></Table></div>}</div></div></Card>;
}
