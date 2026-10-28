import { useEffect, useState } from "react";
import { Alert, Group, NumberInput, Select, Stack } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppButton } from "../../ui";
import { SamplingFormProps, StratifiedSamplingInput, StratifiedSamplingMode } from "./types";

type Input=Omit<StratifiedSamplingInput,"fileId">;
type Props=SamplingFormProps<Input>&{columns:string[]};
export default function StratifiedSamplingForm({columns,disabled,suggestedSize,onSubmit}:Props){
  const {t}=useTranslation("sampling");
  const [strateColumn,setStrateColumn]=useState<string|null>(null);
  const [sampleSize,setSampleSize]=useState<number|"">("");
  const [mode,setMode]=useState<StratifiedSamplingMode>("proportionnel");
  useEffect(()=>{if(suggestedSize)setSampleSize(suggestedSize);},[suggestedSize]);
  const invalid=!strateColumn||(sampleSize!==""&&(typeof sampleSize!=="number"||sampleSize<=0||!Number.isInteger(sampleSize)));
  return <Stack><Alert color="blue">{t(`help.stratified.${mode}`)}</Alert><Group grow align="flex-start"><Select searchable label={t("fields.strateColumn")} data={columns} value={strateColumn} disabled={disabled||columns.length===0} onChange={setStrateColumn}/><NumberInput label={t("fields.optionalSampleSize")} value={sampleSize} min={1} precision={0} disabled={disabled} onChange={setSampleSize}/></Group><Select label={t("fields.mode")} data={["proportionnel","equilibre"].map(value=>({value,label:t(`modes.${value}`)}))} value={mode} disabled={disabled} onChange={value=>setMode((value||"proportionnel") as StratifiedSamplingMode)}/><div className="flex justify-end"><AppButton disabled={disabled||invalid} onClick={()=>{if(strateColumn)onSubmit({strateColumn,sampleSize:sampleSize===""?null:Number(sampleSize),mode});}}>{t("actions.execute")}</AppButton></div></Stack>;
}
