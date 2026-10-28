import { MultiSelect, NumberInput, Select, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import {
  StandardizationMethod,
  StandardizationParameters,
} from "../types";

interface FormValues {
  columns: string[];
  method: StandardizationMethod;
  preview_limit: number;
}

interface Props {
  columns: string[];
  loading: boolean;
  onSubmit: (parameters: StandardizationParameters) => Promise<void>;
}

export default function StandardizationPanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");
  const form = useForm<FormValues>({
    initialValues: { columns: [], method: "z_score", preview_limit: 10 },
    validate: {
      columns: (value) =>
        value.length > 0 ? null : t("standardization.validation.columns"),
      preview_limit: (value) =>
        Number.isInteger(value) && value >= 1 && value <= 500
          ? null
          : t("standardization.validation.previewLimit"),
    },
  });

  const methods = [
    { value: "z_score", label: t("standardization.methods.zScore") },
    { value: "min_max", label: t("standardization.methods.minMax") },
    { value: "robust", label: t("standardization.methods.robust") },
  ];

  return (
    <Card>
      <div className="mb-5">
        <Text weight={700} size="lg">
          {t("standardization.title")}
        </Text>
        <Text size="sm" color="dimmed" mt={4}>
          {t("standardization.description")}
        </Text>
      </div>

      <form
        onSubmit={form.onSubmit((values) =>
          onSubmit({
            columns: values.columns,
            method: values.method,
            preview_limit: values.preview_limit,
          })
        )}
      >
        <Stack spacing="md">
          <MultiSelect
            withAsterisk
            searchable
            clearable
            label={t("standardization.columnsLabel")}
            description={t("standardization.columnsDescription")}
            placeholder={t("standardization.columnsPlaceholder")}
            data={columns.map((column) => ({ value: column, label: column }))}
            disabled={loading || columns.length === 0}
            {...form.getInputProps("columns")}
          />

          <Select
            withAsterisk
            label={t("standardization.methodLabel")}
            data={methods}
            disabled={loading}
            {...form.getInputProps("method")}
          />

          <NumberInput
            label={t("standardization.previewLimitLabel")}
            description={t("standardization.previewLimitDescription")}
            min={1}
            max={500}
            step={1}
            disabled={loading}
            {...form.getInputProps("preview_limit")}
          />

          {columns.length === 0 && (
            <Text size="sm" color="orange">
              {t("standardization.noNumericColumns")}
            </Text>
          )}

          <div className="flex justify-end">
            <AppButton
              type="submit"
              loading={loading}
              disabled={loading || columns.length === 0}
            >
              {t("standardization.submit")}
            </AppButton>
          </div>
        </Stack>
      </form>
    </Card>
  );
}
