import { Text, ThemeIcon } from "@mantine/core";
import {
  IconArrowsShuffle,
  IconChartDots,
  IconLayersIntersect,
  IconRepeat,
  IconTargetArrow,
} from "@tabler/icons-react";
import { useTranslation } from "next-i18next";
import { SamplingMethod } from "./types";

const methods = [
  ["simpleRandom", IconArrowsShuffle],
  ["stratified", IconLayersIntersect],
  ["systematic", IconChartDots],
  ["bootstrap", IconRepeat],
  ["quotas", IconTargetArrow],
] as const;

export default function SamplingMethodSelector({
  value,
  onChange,
  disabled,
}: {
  value: SamplingMethod;
  onChange: (method: SamplingMethod) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation("sampling");
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {methods.map(([method, Icon]) => {
        const selected = method === value;
        return (
          <button
            key={method}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(method)}
            className={`rounded-xl border p-4 text-left transition ${
              selected
                ? "border-[#84BF43] bg-[#f3fadf] ring-2 ring-[#84BF43]/20"
                : "border-gray-200 bg-white hover:border-[#84BF43]"
            }`}
          >
            <ThemeIcon color="brand" variant="light" radius="md">
              <Icon size={18} />
            </ThemeIcon>
            <Text weight={700} size="sm" mt="sm">
              {t(`methods.${method}.title`)}
            </Text>
            <Text size="xs" color="dimmed" mt={4}>
              {t(`methods.${method}.description`)}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
