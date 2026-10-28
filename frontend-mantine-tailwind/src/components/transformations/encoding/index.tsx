import { Checkbox, MultiSelect, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import { OneHotEncodingParameters } from "../types";

interface FormValues {
  columns: string[];
  drop_first: boolean;
  drop_original: boolean;
}

interface Props {
  columns: string[];
  loading: boolean;
  onSubmit: (parameters: OneHotEncodingParameters) => Promise<void>;
}

export default function EncodingPanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");

  const form = useForm<FormValues>({
    initialValues: {
      columns: [],
      drop_first: false,
      drop_original: true,
    },

    validate: {
      columns: (value) =>
        value.length > 0 && new Set(value).size === value.length
          ? null
          : t("encoding.validation.columns"),
    },
  });

  return (
    <Card>
      <div className="mb-5">
        <Text weight={700} size="lg">
          {t("encoding.title")}
        </Text>

        <Text size="sm" color="dimmed" mt={4}>
          {t("encoding.description")}
        </Text>
      </div>

      <form
        onSubmit={form.onSubmit((values) =>
          onSubmit({
            columns: Array.from(new Set(values.columns)),
            drop_first: values.drop_first,
            drop_original: values.drop_original,
            preview_limit: 10,
          })
        )}
      >
        <Stack spacing="md">
          <MultiSelect
            withAsterisk
            searchable
            clearable
            label={t("encoding.columnsLabel")}
            description={t("encoding.columnsDescription")}
            placeholder={t("encoding.columnsPlaceholder")}
            data={columns.map((column) => ({
              value: column,
              label: column,
            }))}
            disabled={loading || columns.length === 0}
            {...form.getInputProps("columns")}
          />

          <Checkbox
            label={t("encoding.dropFirstLabel")}
            description={t("encoding.dropFirstDescription")}
            disabled={loading}
            {...form.getInputProps("drop_first", {
              type: "checkbox",
            })}
          />

          <Checkbox
            label={t("encoding.dropOriginalLabel")}
            description={t("encoding.dropOriginalDescription")}
            disabled={loading}
            {...form.getInputProps("drop_original", {
              type: "checkbox",
            })}
          />

          {columns.length === 0 && (
            <Text size="sm" color="orange">
              {t("encoding.noColumns")}
            </Text>
          )}

          <div className="flex justify-end">
            <AppButton
              type="submit"
              loading={loading}
              disabled={loading || columns.length === 0}
            >
              {t("encoding.submit")}
            </AppButton>
          </div>
        </Stack>
      </form>
    </Card>
  );
}