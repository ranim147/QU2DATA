import { useMemo, useState } from "react";
import { Group, NumberInput, Select, Stack, Text } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppButton, Card } from "../../ui";
import { SamplingConfidence } from "./types";

const zScores: Record<SamplingConfidence, number> = {
  90: 1.645,
  95: 1.96,
  99: 2.576,
};

export default function SamplingSizeCalculator({
  onApply,
  canApply,
}: {
  onApply: (size: number) => void;
  canApply: boolean;
}) {
  const { t } = useTranslation("sampling");
  const [population, setPopulation] = useState<number | "">(1000);
  const [confidence, setConfidence] = useState<SamplingConfidence>(95);
  const [margin, setMargin] = useState<number | "">(5);
  const [prevalence, setPrevalence] = useState<number | "">(50);
  const calculation = useMemo(() => {
    if (
      typeof population !== "number" || population <= 0 ||
      typeof margin !== "number" || margin <= 0 || margin >= 100 ||
      typeof prevalence !== "number" || prevalence <= 0 || prevalence >= 100
    ) return null;
    const z = zScores[confidence];
    const p = prevalence / 100;
    const e = margin / 100;
    const n0 = (z * z * p * (1 - p)) / (e * e);
    const corrected = n0 / (1 + (n0 - 1) / population);
    return { z, n0, corrected: Math.ceil(corrected) };
  }, [confidence, margin, population, prevalence]);
  return <Card><Stack><div><Text weight={700}>{t("calculator.title")}</Text><Text size="sm" color="dimmed">{t("calculator.description")}</Text></div><Group grow><NumberInput label={t("calculator.population")} value={population} min={1} precision={0} onChange={setPopulation}/><Select label={t("fields.confidence")} data={["90","95","99"]} value={String(confidence)} onChange={value=>setConfidence(Number(value||95) as SamplingConfidence)}/><NumberInput label={t("calculator.margin")} value={margin} min={0.1} max={99} precision={1} onChange={setMargin}/><NumberInput label={t("calculator.prevalence")} value={prevalence} min={0.1} max={99.9} precision={1} onChange={setPrevalence}/></Group>{calculation&&<Group position="apart"><Text size="sm">{t("calculator.summary",{n0:calculation.n0.toFixed(1),n:calculation.corrected,z:calculation.z,margin})}</Text><AppButton intent="ghost" disabled={!canApply} onClick={()=>onApply(calculation.corrected)}>{t("calculator.apply",{n:calculation.corrected})}</AppButton></Group>}</Stack></Card>;
}
