﻿import { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { useQuery, useMutation } from "@apollo/client";
import { Button, LoadingOverlay, Text } from "@mantine/core";
import {
  GET_DATA_QUALITY_REPORT,
  GENERATE_DATA_QUALITY_REPORT,
  GetDataQualityReportType,
  GenerateDataQualityReportType,
} from "./query";
import { DIMENSIONS } from "./types";
import ScoreGauge from "./scoreGauge";

interface Props {
  fileId: string;
  autoGenerate?: boolean;
}

export default function DataQualityPanel({ fileId, autoGenerate }: Props) {
  const { t } = useTranslation("dataQuality");
  const auto = Boolean(autoGenerate);
  const [filter, setFilter] = useState<"all" | "anomalies">("all");

  const { data, loading, refetch } = useQuery<GetDataQualityReportType>(
    GET_DATA_QUALITY_REPORT,
    { variables: { fileId } }
  );

  const [generateReport, { loading: loading_report }] =
    useMutation<GenerateDataQualityReportType>(GENERATE_DATA_QUALITY_REPORT);

  const report = data?.getDataQualityReport.report;

  const hasAttemptedGen = useRef(false);

  useEffect(() => {
    if (!auto) return;
    if (!fileId) return;
    if (report) return;
    if (loading_report) return;
    if (hasAttemptedGen.current) return;

    hasAttemptedGen.current = true;
    generateReport({ variables: { fileId } })
      .then(() => refetch())
      .catch(() => {});
  }, [auto, fileId, report, loading_report]);

  function handleGenerate() {
    generateReport({ variables: { fileId } }).then(() => refetch());
  }

  if (loading || loading_report) {
    return (
      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-6 py-14 text-center">
        <h2 className="font-bold text-gray-900">{t("no_report_title")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("no_report_desc")}</p>
        {!auto ? (
          <Button color="brand" mt="md" loading={loading_report} onClick={handleGenerate}>
            {t("generate_button")}
          </Button>
        ) : null}
      </div>
    );
  }

  const variableMetrics = report.variableMetrics ?? [];
  const anomaliesCount = variableMetrics.filter((v) => v.hasAnomaly).length;
  const filteredMetrics =
    filter === "all" ? variableMetrics : variableMetrics.filter((v) => v.hasAnomaly);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
            {t("eyebrow")}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        {!auto ? (
          <Button variant="default" loading={loading_report} onClick={handleGenerate}>
            {t("recalculate_button")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-6">
          <ScoreGauge score={report.qualityScore} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {DIMENSIONS.map((dim) => {
            const value = report[dim.key];
            const percentage = Math.round(value * 100);
            return (
              <div key={dim.key} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {t(dim.labelKey)}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">
                  {percentage}%
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#84BF43]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Text size="xs" color="dimmed" tt="uppercase" weight={700}>
            {t("missing_values")}
          </Text>
          <Text size="xl" weight={800}>
            {report.missingValuesCount}
          </Text>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Text size="xs" color="dimmed" tt="uppercase" weight={700}>
            {t("duplicate_rows")}
          </Text>
          <Text size="xl" weight={800}>
            {report.duplicateRowsCount}
          </Text>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Text size="xs" color="dimmed" tt="uppercase" weight={700}>
            {t("outliers")}
          </Text>
          <Text size="xl" weight={800}>
            {report.outliersCount}
          </Text>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900">{t("diagnostic_title")}</h3>
            <p className="text-xs text-gray-500">{t("diagnostic_subtitle")}</p>
          </div>

          {variableMetrics.length > 0 && (
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  filter === "all"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500"
                }`}
              >
                {t("diagnostic_filter_all")} ({variableMetrics.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("anomalies")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  filter === "anomalies"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500"
                }`}
              >
                {t("diagnostic_filter_anomalies")} ({anomaliesCount})
              </button>
            </div>
          )}
        </div>

        {variableMetrics.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            {t("diagnostic_empty")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMetrics.map((v) => {
              const roundedScore = Math.round(v.score);
              const scoreColor =
                roundedScore >= 90
                  ? "#84BF43"
                  : roundedScore >= 60
                  ? "#f0a83d"
                  : "#e05252";

              return (
                <div key={v.featureId} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
                      {v.name}
                    </p>
                    {v.label && (
                      <p className="truncate text-xs text-gray-500">{v.label}</p>
                    )}
                  </div>

                  <div className="w-32 shrink-0">
                    <p className="text-lg font-extrabold" style={{ color: scoreColor }}>
                      {roundedScore}
                    </p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${roundedScore}%`,
                          backgroundColor: scoreColor,
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {t("diagnostic_score_label")}
                    </p>
                  </div>

                  <div className="w-36 shrink-0 text-xs text-gray-500">
                    Ø {v.missingCount} ({v.missingPercentage.toFixed(1)}%)
                  </div>

                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {!v.hasAnomaly ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        ✓ {t("diagnostic_no_anomaly")}
                      </span>
                    ) : (
                      <>
                        {v.outliersCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                            ⚠ {t("diagnostic_outliers_badge", { count: v.outliersCount })}
                          </span>
                        )}
                        {v.missingPercentage > 10 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            {t("diagnostic_missing_badge", {
                              percentage: v.missingPercentage.toFixed(0),
                            })}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMetrics.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                {t("diagnostic_empty_filtered")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}