import { MultiSelect, NumberInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import { NormalizationParameters } from "../types";

interface FormValues {
  columns: string[];
  preview_limit: number;
}

interface Props {
  columns: string[];
  loading: boolean;
  onSubmit: (parameters: NormalizationParameters) => Promise<void>;
}

export default function NormalizationPanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");
  const form = useForm<FormValues>({
    initialValues: { columns: [], preview_limit: 10 },
    validate: {
      columns: (value) =>
        value.length > 0 && new Set(value).size === value.length
          ? null
          : t("normalization.validation.columns"),
      preview_limit: (value) =>
        Number.isInteger(value) && value >= 1 && value <= 500
          ? null
          : t("normalization.validation.previewLimit"),
    },
  });

  return (
    <Card>
      <div className="mb-5">
        <Text weight={700} size="lg">
          {t("normalization.title")}
        </Text>
        <Text size="sm" color="dimmed" mt={4}>
          {t("normalization.description")}
        </Text>
      </div>

      <form
        onSubmit={form.onSubmit((values) =>
          onSubmit({
            columns: Array.from(new Set(values.columns)),
            preview_limit: values.preview_limit,
          })
        )}
      >
        <Stack spacing="md">
          <MultiSelect
            withAsterisk
            searchable
            clearable
            label={t("normalization.columnsLabel")}
            description={t("normalization.columnsDescription")}
            placeholder={t("normalization.columnsPlaceholder")}
            data={columns.map((column) => ({ value: column, label: column }))}
            disabled={loading || columns.length === 0}
            {...form.getInputProps("columns")}
          />

          <NumberInput
            label={t("normalization.previewLimitLabel")}
            description={t("normalization.previewLimitDescription")}
            min={1}
            max={500}
            step={1}
            disabled={loading}
            {...form.getInputProps("preview_limit")}
          />

          {columns.length === 0 && (
            <Text size="sm" color="orange">
              {t("normalization.noNumericColumns")}
            </Text>
          )}

          <div className="flex justify-end">
            <AppButton
              type="submit"
              loading={loading}
              disabled={loading || columns.length === 0}
            >
              {t("normalization.submit")}
            </AppButton>
          </div>
        </Stack>
      </form>
    </Card>
  );
}
