import { Checkbox, MultiSelect, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import { ConcatParameters } from "../types";
interface Props { columns: string[]; loading: boolean; onSubmit: (parameters: ConcatParameters) => Promise<void>; }
export default function ConcatPanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");
  const form = useForm<ConcatParameters>({ initialValues: { columns: [], new_column: "", separator: "-", keep_original: true, overwrite: false }, validate: { columns: (value) => value.length >= 2 && new Set(value).size === value.length ? null : t("concat.validation.columns"), new_column: (value) => value.trim() ? null : t("concat.validation.newColumn") } });
  return <Card><Text weight={700} size="lg">{t("concat.title")}</Text><Text size="sm" color="dimmed" mt={4} mb="md">{t("concat.description")}</Text>
    <form onSubmit={form.onSubmit((values) => onSubmit({ ...values, new_column: values.new_column.trim() }))}><Stack spacing="md">
      <MultiSelect searchable withAsterisk label={t("concat.columns")} description={t("concat.orderHelp")} data={columns} disabled={loading} {...form.getInputProps("columns")} />
      <TextInput label={t("concat.separator")} description={t("concat.separatorHelp")} disabled={loading} {...form.getInputProps("separator")} />
      <TextInput withAsterisk label={t("concat.newColumn")} disabled={loading} {...form.getInputProps("new_column")} />
      <Checkbox label={t("concat.keepOriginal")} disabled={loading} {...form.getInputProps("keep_original",{type:"checkbox"})}/><Checkbox label={t("concat.overwrite")} disabled={loading} {...form.getInputProps("overwrite",{type:"checkbox"})}/>
      <div className="flex justify-end"><AppButton type="submit" loading={loading} disabled={loading}>{t("concat.submit")}</AppButton></div>
    </Stack></form></Card>;
}
