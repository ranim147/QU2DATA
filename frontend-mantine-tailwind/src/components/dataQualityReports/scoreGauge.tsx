import { getQualityLevel, LEVEL_COLORS } from "./types";
import { useTranslation } from "next-i18next";

interface ScoreGaugeProps {
  score: number; // sur 100
}

const RADIUS = 54;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const { t } = useTranslation("dataQuality");
  const { level, labelKey } = getQualityLevel(score);
  const color = LEVEL_COLORS[level];

  // Longueur du trait à afficher, proportionnelle au score (0 à 100)
  const filledLength = (score / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
          {/* Anneau de fond, gris clair */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#F1F2F3"
            strokeWidth={STROKE}
          />
          {/* Anneau de progression, coloré selon le niveau */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${filledLength} ${CIRCUMFERENCE}`}
          />
        </svg>
        {/* Le chiffre, centré par-dessus le cercle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-extrabold text-gray-900">
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span
        className="mt-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
        style={{ background: `${color}22`, color }}
      >
        {t(labelKey)}
      </span>
      <span className="mt-1 text-sm font-semibold text-gray-700">
        {t("global_score")}
      </span>
    </div>
  );
}