import { Checkbox, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import { BinningParameters } from "../types";

interface Rule { label: string; min: number; max: number }
interface Values {
  source_column: string;
  new_column: string;
  bins: Rule[];
  default_value: string;
  keep_original: boolean;
  overwrite: boolean;
}
interface Props {
  columns: string[];
  loading: boolean;
  onSubmit: (parameters: BinningParameters) => Promise<void>;
}

export default function BinningPanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");
  const form = useForm<Values>({
    initialValues: {
      source_column: "", new_column: "", default_value: "",
      keep_original: true, overwrite: false,
      bins: [{ label: "", min: 0, max: 0 }],
    },
    validate: {
      source_column: (value) => value ? null : t("binning.validation.source"),
      new_column: (value) => value.trim() ? null : t("binning.validation.newColumn"),
      bins: (rules) => {
        if (rules.length === 0) return t("binning.validation.rules");
        if (rules.some((rule) => !rule.label.trim() || !Number.isFinite(rule.min) || !Number.isFinite(rule.max) || rule.min > rule.max)) {
          return t("binning.validation.rules");
        }
        return null;
      },
    },
  });

  return <Card>
    <div className="mb-5">
      <Text weight={700} size="lg">{t("binning.title")}</Text>
      <Text size="sm" color="dimmed" mt={4}>{t("binning.description")}</Text>
    </div>
    <form onSubmit={form.onSubmit((values) => onSubmit({
      source_column: values.source_column,
      new_column: values.new_column.trim(),
      bins: values.bins.map((rule) => ({ ...rule, label: rule.label.trim() })),
      ...(values.default_value === "" ? {} : { default_value: values.default_value }),
      keep_original: values.keep_original,
      overwrite: values.overwrite,
    }))}>
      <Stack spacing="md">
        <Select searchable withAsterisk label={t("binning.source")}
          data={columns.map((value) => ({ value, label: value }))}
          disabled={loading || columns.length === 0} {...form.getInputProps("source_column")} />
        <TextInput withAsterisk label={t("binning.newColumn")} disabled={loading} {...form.getInputProps("new_column")} />
        <div className="space-y-3">
          <Text weight={600} size="sm">{t("binning.rules")}</Text>
          {form.values.bins.map((_, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr,1fr,1fr,auto]">
            <TextInput label={t("binning.label")} disabled={loading} {...form.getInputProps(`bins.${index}.label`)} />
            <NumberInput label={t("binning.min")} disabled={loading} {...form.getInputProps(`bins.${index}.min`)} />
            <NumberInput label={t("binning.max")} disabled={loading} {...form.getInputProps(`bins.${index}.max`)} />
            <div className="flex items-end"><AppButton intent="ghost" disabled={loading || form.values.bins.length === 1} onClick={() => form.removeListItem("bins", index)}>{t("binning.remove")}</AppButton></div>
          </div>)}
          {typeof form.errors.bins === "string" && <Text size="xs" color="red">{form.errors.bins}</Text>}
          <AppButton intent="ghost" disabled={loading} onClick={() => form.insertListItem("bins", { label: "", min: 0, max: 0 })}>{t("binning.addRule")}</AppButton>
        </div>
        <TextInput label={t("binning.defaultValue")} disabled={loading} {...form.getInputProps("default_value")} />
        <Checkbox label={t("binning.keepOriginal")} disabled={loading} {...form.getInputProps("keep_original", { type: "checkbox" })} />
        <Checkbox label={t("binning.overwrite")} disabled={loading} {...form.getInputProps("overwrite", { type: "checkbox" })} />
        <div className="flex justify-end"><AppButton type="submit" loading={loading} disabled={loading || columns.length === 0}>{t("binning.submit")}</AppButton></div>
      </Stack>
    </form>
  </Card>;
}
