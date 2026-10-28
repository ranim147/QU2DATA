import { useEffect, useState } from "react";
import { Alert, Group, NumberInput, Select, Stack } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppButton } from "../../ui";
import {
  SamplingConfidence,
  SamplingFormProps,
  SystematicSamplingInput,
  SystematicSamplingSizeMode,
} from "./types";

type Props = SamplingFormProps<Omit<SystematicSamplingInput, "fileId">>;

export default function SystematicSamplingForm({
  disabled,
  suggestedSize,
  onSubmit,
}: Props) {
  const { t } = useTranslation("sampling");
  const [sizeMode, setSizeMode] = useState<SystematicSamplingSizeMode>("n");
  const [size, setSize] = useState<number | "">(1);
  const [seed, setSeed] = useState<number | "">(42);
  const [confidence, setConfidence] = useState<SamplingConfidence>(95);
  useEffect(() => {
    if (suggestedSize && sizeMode === "n") setSize(suggestedSize);
  }, [sizeMode, suggestedSize]);
  const invalid =
    typeof size !== "number" || size <= 0 ||
    (sizeMode === "percent" && size > 100) ||
    typeof seed !== "number" || !Number.isInteger(seed);
  return (
    <Stack>
      <Alert color="blue">{t(`help.systematic.${sizeMode}`)}</Alert>
      <Group grow>
        <Select label={t("fields.sizeMode")} data={["n", "percent", "k"].map((value) => ({value,label:t(`modes.${value}`)}))} value={sizeMode} disabled={disabled} onChange={(value)=>setSizeMode((value||"n") as SystematicSamplingSizeMode)}/>
        <NumberInput label={t("fields.size")} value={size} min={0} max={sizeMode==="percent"?100:undefined} precision={sizeMode==="percent"?2:0} disabled={disabled} onChange={setSize}/>
      </Group>
      <Group grow>
        <NumberInput label={t("fields.seed")} value={seed} precision={0} disabled={disabled} onChange={setSeed}/>
        <Select label={t("fields.confidence")} data={["90","95","99"]} value={String(confidence)} disabled={disabled} onChange={(value)=>setConfidence(Number(value||95) as SamplingConfidence)}/>
      </Group>
      <div className="flex justify-end"><AppButton disabled={disabled||invalid} onClick={()=>{if(typeof size==="number"&&typeof seed==="number")onSubmit({size,sizeMode,seed,confidence});}}>{t("actions.execute")}</AppButton></div>
    </Stack>
  );
}
