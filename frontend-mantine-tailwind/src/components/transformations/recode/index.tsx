import { Checkbox, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import { RecodeParameters } from "../types";

interface Rule { oldValue: string; newValue: string }
interface Values {
  source_column: string; new_column: string; rules: Rule[];
  default_value: string; keep_original: boolean; overwrite: boolean;
}
interface Props { columns: string[]; loading: boolean; onSubmit: (parameters: RecodeParameters) => Promise<void> }

export default function RecodePanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");
  const form = useForm<Values>({
    initialValues: {
      source_column: "", new_column: "", default_value: "",
      keep_original: true, overwrite: false,
      rules: [{ oldValue: "", newValue: "" }],
    },
    validate: {
      source_column: (value) => value ? null : t("recode.validation.source"),
      new_column: (value) => value.trim() ? null : t("recode.validation.newColumn"),
      rules: (rules) => {
        const oldValues = rules.map((rule) => rule.oldValue.trim());
        if (rules.length === 0 || rules.some((rule) => !rule.oldValue.trim() || !rule.newValue.trim())) return t("recode.validation.rules");
        if (new Set(oldValues).size !== oldValues.length) return t("recode.validation.duplicates");
        return null;
      },
    },
  });

  return <Card>
    <div className="mb-5">
      <Text weight={700} size="lg">{t("recode.title")}</Text>
      <Text size="sm" color="dimmed" mt={4}>{t("recode.description")}</Text>
    </div>
    <form onSubmit={form.onSubmit((values) => onSubmit({
      source_column: values.source_column,
      new_column: values.new_column.trim(),
      mapping: Object.fromEntries(values.rules.map((rule) => [rule.oldValue.trim(), rule.newValue.trim()])),
      ...(values.default_value === "" ? {} : { default_value: values.default_value }),
      keep_original: values.keep_original,
      overwrite: values.overwrite,
    }))}>
      <Stack spacing="md">
        <Select searchable withAsterisk label={t("recode.source")}
          data={columns.map((value) => ({ value, label: value }))}
          disabled={loading || columns.length === 0} {...form.getInputProps("source_column")} />
        <TextInput withAsterisk label={t("recode.newColumn")} disabled={loading} {...form.getInputProps("new_column")} />
        <div className="space-y-3">
          <Text weight={600} size="sm">{t("recode.rules")}</Text>
          {form.values.rules.map((_, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr,1fr,auto]">
            <TextInput label={t("recode.oldValue")} disabled={loading} {...form.getInputProps(`rules.${index}.oldValue`)} />
            <TextInput label={t("recode.newValue")} disabled={loading} {...form.getInputProps(`rules.${index}.newValue`)} />
            <div className="flex items-end"><AppButton intent="ghost" disabled={loading || form.values.rules.length === 1} onClick={() => form.removeListItem("rules", index)}>{t("recode.remove")}</AppButton></div>
          </div>)}
          {typeof form.errors.rules === "string" && <Text size="xs" color="red">{form.errors.rules}</Text>}
          <AppButton intent="ghost" disabled={loading} onClick={() => form.insertListItem("rules", { oldValue: "", newValue: "" })}>{t("recode.addRule")}</AppButton>
        </div>
        <TextInput label={t("recode.defaultValue")} disabled={loading} {...form.getInputProps("default_value")} />
        <Checkbox label={t("recode.keepOriginal")} disabled={loading} {...form.getInputProps("keep_original", { type: "checkbox" })} />
        <Checkbox label={t("recode.overwrite")} disabled={loading} {...form.getInputProps("overwrite", { type: "checkbox" })} />
        <div className="flex justify-end"><AppButton type="submit" loading={loading} disabled={loading || columns.length === 0}>{t("recode.submit")}</AppButton></div>
      </Stack>
    </form>
  </Card>;
}
