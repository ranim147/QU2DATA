export interface FormatOption {
  value: string;
  label: string;
  group: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: "A4", label: "A4 (210 × 297 mm)", group: "Papier" },
  { value: "A3", label: "A3 (297 × 420 mm)", group: "Papier" },
  { value: "A2", label: "A2 (420 × 594 mm)", group: "Papier" },
  { value: "A1", label: "A1 (594 × 841 mm)", group: "Papier" },
  { value: "A0", label: "A0 (841 × 1189 mm)", group: "Papier" },
  { value: "LETTER", label: "Letter (8.5 × 11 in)", group: "Papier" },
  { value: "LEGAL", label: "Legal (8.5 × 14 in)", group: "Papier" },
  { value: "TABLOID", label: "Tabloid (11 × 17 in)", group: "Papier" },

  { value: "SIXTEEN_NINE", label: "16:9 (écran)", group: "Écran" },
  { value: "FOUR_THREE", label: "4:3 (écran)", group: "Écran" },

  { value: "CUSTOM", label: "Personnalisé", group: "Personnalisé" },
];

// Formats papier : le toggle Paysage/Portrait leur est proposé
export const PAPER_FORMATS = [
  "A4", "A3", "A2", "A1", "A0", "LETTER", "LEGAL", "TABLOID",
];