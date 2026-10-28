import { Checkbox, MultiSelect, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../../ui";
import { CalculateParameters } from "../types";
interface Props { columns: string[]; loading: boolean; onSubmit: (parameters: CalculateParameters) => Promise<void>; }
export default function CalculatePanel({ columns, loading, onSubmit }: Props) {
  const { t } = useTranslation("transformations");
  const form=useForm<CalculateParameters>({initialValues:{columns:[],new_column:"",formula:"",keep_original:true,overwrite:false},validate:{columns:(value)=>value.length&&new Set(value).size===value.length?null:t("calculate.validation.columns"),new_column:(value)=>value.trim()?null:t("calculate.validation.newColumn"),formula:(value)=>value.trim()&&value.length<=1000?null:t("calculate.validation.formula")}});
  return <Card><Text weight={700} size="lg">{t("calculate.title")}</Text><Text size="sm" color="dimmed" mt={4} mb="md">{t("calculate.description")}</Text>
    <form onSubmit={form.onSubmit((values)=>onSubmit({...values,new_column:values.new_column.trim(),formula:values.formula.trim()}))}><Stack spacing="md">
      <MultiSelect searchable withAsterisk label={t("calculate.columns")} data={columns} disabled={loading} {...form.getInputProps("columns")}/>
      <TextInput withAsterisk label={t("calculate.newColumn")} disabled={loading} {...form.getInputProps("new_column")}/>
      <Textarea withAsterisk minRows={3} label={t("calculate.formula")} description={t("calculate.formulaHelp")} placeholder="round(Price * Quantity, 2)" disabled={loading} {...form.getInputProps("formula")}/>
      <Text size="xs" color="dimmed">{t("calculate.examples")}</Text>
      <Checkbox label={t("calculate.keepOriginal")} disabled={loading} {...form.getInputProps("keep_original",{type:"checkbox"})}/><Checkbox label={t("calculate.overwrite")} disabled={loading} {...form.getInputProps("overwrite",{type:"checkbox"})}/>
      <div className="flex justify-end"><AppButton type="submit" loading={loading} disabled={loading||columns.length===0}>{t("calculate.submit")}</AppButton></div>
    </Stack></form></Card>;
}
