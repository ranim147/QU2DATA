import { Alert, Badge, MultiSelect, Select, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import { AppButton, AppTable, Card } from "../../../ui";
import {
  LogTransformAction,
  LogTransformAnalysisResult,
  LogTransformMethod,
  LogTransformParameters,
} from "../types";

interface FormValues {
  columns: string[];
  method: LogTransformMethod;
  action: LogTransformAction;
}

interface Props {
  columns: string[];
  action: "analyzeLog" | "transformLog" | null;
  analysis: LogTransformAnalysisResult | null;
  onAnalyze: (parameters: LogTransformParameters) => Promise<unknown>;
  onExecute: (parameters: LogTransformParameters) => Promise<void>;
  onParametersChange: () => void;
}

const displayNumber = (value?: number | null) =>
  value === null || value === undefined ? "—" : String(value);

export default function LogTransformPanel({
  columns,
  action,
  analysis,
  onAnalyze,
  onExecute,
  onParametersChange,
}: Props) {
  const { t } = useTranslation("transformations");
  const analyzedFingerprint = useRef<string | null>(null);
  const form = useForm<FormValues>({
    initialValues: { columns: [], method: "log1p", action: "replace" },
    validate: {
      columns: (value) =>
        value.length > 0 && new Set(value).size === value.length
          ? null
          : t("logTransform.validation.columns"),
    },
  });

  const parameters = useMemo<LogTransformParameters>(
    () => ({
      columns: Array.from(new Set(form.values.columns)),
      method: form.values.method,
      action: form.values.action,
    }),
    [form.values.action, form.values.columns, form.values.method]
  );
  const fingerprint = JSON.stringify([parameters.columns, parameters.method]);
  const analysisCurrent = analyzedFingerprint.current === fingerprint && analysis;
  const allEligible =
    Boolean(analysisCurrent) &&
    parameters.columns.every((column) => analysis?.results[column]?.eligible);

  useEffect(() => {
    if (analyzedFingerprint.current && analyzedFingerprint.current !== fingerprint) {
      analyzedFingerprint.current = null;
      onParametersChange();
    }
  }, [fingerprint, onParametersChange]);

  const analyze = async () => {
    const errors = form.validate();
    if (errors.hasErrors) return;
    const result = await onAnalyze(parameters);
    if (result) analyzedFingerprint.current = fingerprint;
  };

  return (
    <Card>
      <div className="mb-5">
        <Text weight={700} size="lg">{t("logTransform.title")}</Text>
        <Text size="sm" color="dimmed" mt={4}>
          {t("logTransform.description")}
        </Text>
      </div>

      <Stack spacing="md">
        <MultiSelect
          withAsterisk searchable clearable
          label={t("logTransform.columnsLabel")}
          placeholder={t("logTransform.columnsPlaceholder")}
          data={columns.map((column) => ({ value: column, label: column }))}
          disabled={Boolean(action) || columns.length === 0}
          {...form.getInputProps("columns")}
        />
        <Select
          withAsterisk
          label={t("logTransform.methodLabel")}
          data={[
            { value: "log1p", label: "log1p(x)" },
            { value: "log", label: "log(x)" },
          ]}
          disabled={Boolean(action)}
          {...form.getInputProps("method")}
        />
        <Select
          withAsterisk
          label={t("logTransform.actionLabel")}
          data={[
            { value: "replace", label: t("logTransform.actions.replace") },
            { value: "new_column", label: t("logTransform.actions.newColumn") },
            { value: "ignore", label: t("logTransform.actions.ignore") },
          ]}
          disabled={Boolean(action)}
          {...form.getInputProps("action")}
        />

        {columns.length === 0 && (
          <Alert color="yellow">{t("logTransform.noNumericColumns")}</Alert>
        )}

        {analysisCurrent && (
          <div className="overflow-x-auto">
            <AppTable>
              <thead><tr>
                <th>{t("logTransform.results.column")}</th>
                <th>{t("logTransform.results.eligible")}</th>
                <th>{t("logTransform.results.reason")}</th>
                <th>{t("logTransform.results.before")}</th>
                <th>{t("logTransform.results.after")}</th>
                <th>{t("logTransform.results.min")}</th>
              </tr></thead>
              <tbody>
                {parameters.columns.map((column) => {
                  const result = analysis.results[column];
                  return <tr key={column}>
                    <td>{column}</td>
                    <td><Badge color={result?.eligible ? "green" : "red"}>
                      {result?.eligible ? t("logTransform.yes") : t("logTransform.no")}
                    </Badge></td>
                    <td>{result?.reason || "—"}</td>
                    <td>{displayNumber(result?.skewnessBefore)}</td>
                    <td>{displayNumber(result?.skewnessAfter)}</td>
                    <td>{displayNumber(result?.min)}</td>
                  </tr>;
                })}
              </tbody>
            </AppTable>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <AppButton
            intent="ghost"
            loading={action === "analyzeLog"}
            disabled={Boolean(action) || columns.length === 0}
            onClick={analyze}
          >{t("logTransform.analyze")}</AppButton>
          <AppButton
            loading={action === "transformLog"}
            disabled={Boolean(action) || !allEligible}
            onClick={() => onExecute(parameters)}
          >{t("logTransform.apply")}</AppButton>
        </div>
      </Stack>
    </Card>
  );
}
