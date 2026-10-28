const BRAND = "#84BF43";
const BRAND_LIGHT = "#d1ec96";
const INK = "#111111";
const GRAY = "#d1d5db";

export function BarChartSvg() {
  const groups = [
    [62, 40],
    [48, 70],
    [78, 55],
    [36, 64],
    [88, 72],
  ];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="8"
          x2="192"
          y1={30 + i * 25}
          y2={30 + i * 25}
          stroke={GRAY}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      ))}
      {groups.map(([a, b], i) => {
        const x = 18 + i * 36;
        return (
          <g key={i}>
            <rect x={x} y={108 - a} width="11" height={a} rx="2" fill={BRAND} />
            <rect x={x + 14} y={108 - b} width="11" height={b} rx="2" fill={INK} />
          </g>
        );
      })}
      <line x1="8" x2="192" y1="108" y2="108" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

export function LineChartSvg() {
  const area = "M8,90 L40,72 L72,80 L104,50 L136,58 L168,28 L192,36 L192,108 L8,108 Z";
  const line = "M8,90 L40,72 L72,80 L104,50 L136,58 L168,28 L192,36";
  const points = [
    [8, 90],
    [40, 72],
    [72, 80],
    [104, 50],
    [136, 58],
    [168, 28],
    [192, 36],
  ];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="8"
          x2="192"
          y1={28 + i * 27}
          y2={28 + i * 27}
          stroke={GRAY}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      ))}
      <path d={area} fill={BRAND_LIGHT} opacity="0.6" />
      <path d={line} fill="none" stroke={BRAND} strokeWidth="3" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke={INK} strokeWidth="2" />
      ))}
    </svg>
  );
}

export function DonutSvg({ label = "T2B" }: { label?: string }) {
  // 3 segments on a circle of r=40 (circumference ≈ 251.3)
  const C = 2 * Math.PI * 40;
  const seg = (fraction: number) => `${fraction * C} ${C}`;
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden>
      <g transform="rotate(-90 60 60)">
        <circle cx="60" cy="60" r="40" fill="none" stroke={GRAY} strokeWidth="18" />
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke={BRAND}
          strokeWidth="18"
          strokeDasharray={seg(0.52)}
        />
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke={INK}
          strokeWidth="18"
          strokeDasharray={seg(0.21)}
          strokeDashoffset={-0.52 * C}
        />
      </g>
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill={INK}
        fontFamily="inherit"
      >
        73%
      </text>
      <text
        x="60"
        y="74"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#6b7280"
        fontFamily="inherit"
      >
        {label}
      </text>
    </svg>
  );
}

export function SparklineSvg({ up = true }: { up?: boolean }) {
  const d = up
    ? "M2,22 L14,16 L26,18 L38,10 L50,12 L62,4"
    : "M2,8 L14,12 L26,10 L38,16 L50,14 L62,20";
  return (
    <svg viewBox="0 0 64 26" className="w-16 h-6" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={up ? BRAND : INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MockKpi({
  label,
  value,
  up,
}: {
  label: string;
  value: string;
  up?: boolean;
}) {
  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <div className="flex items-end justify-between gap-1">
        <span className="text-base font-extrabold text-black">{value}</span>
        <SparklineSvg up={up} />
      </div>
    </div>
  );
}

export function DashboardMockup({
  kpis,
}: {
  kpis: { label: string; value: string; up?: boolean }[];
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-300/40 overflow-hidden select-none">
      {/* Fake window toolbar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-white">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#84BF43]" />
        <span className="ml-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          DataSense Pro — Dashboard
        </span>
      </div>

      <div className="p-4 space-y-3 bg-gray-50/60">
        {/* KPI row */}
        <div className="flex gap-3">
          {kpis.map((kpi) => (
            <MockKpi key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-2 h-36">
            <LineChartSvg />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2 h-36">
            <DonutSvg />
          </div>
          <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-2 h-32">
            <BarChartSvg />
          </div>
        </div>
      </div>
    </div>
  );
}
