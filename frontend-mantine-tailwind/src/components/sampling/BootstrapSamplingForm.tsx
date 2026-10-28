import { useEffect, useState } from "react";
import { Alert, NumberInput, Stack } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppButton } from "../../ui";
import { BootstrapSamplingInput, SamplingFormProps } from "./types";

type Props = SamplingFormProps<Omit<BootstrapSamplingInput, "fileId">>;
export default function BootstrapSamplingForm({disabled,suggestedSize,onSubmit}:Props){
  const {t}=useTranslation("sampling");
  const [sampleSize,setSampleSize]=useState<number|"">(1);
  useEffect(()=>{if(suggestedSize)setSampleSize(suggestedSize);},[suggestedSize]);
  const invalid=typeof sampleSize!=="number"||sampleSize<=0||!Number.isInteger(sampleSize);
  return <Stack><Alert color="blue">{t("help.bootstrap")}</Alert><NumberInput label={t("fields.sampleSize")} value={sampleSize} min={1} precision={0} disabled={disabled} onChange={setSampleSize}/><div className="flex justify-end"><AppButton disabled={disabled||invalid} onClick={()=>{if(typeof sampleSize==="number")onSubmit({sampleSize});}}>{t("actions.execute")}</AppButton></div></Stack>;
}
