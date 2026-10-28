import {
  TextWidgetAlignment,
  TextWidgetValue,
  TextWidgetVariant,
} from "./types";

const TEXT_VARIANTS: TextWidgetVariant[] = [
  "TITLE",
  "SUBTITLE",
  "PARAGRAPH",
];

const TEXT_ALIGNMENTS: TextWidgetAlignment[] = [
  "LEFT",
  "CENTER",
  "RIGHT",
];

const isRecord = (
  value: unknown
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

export const validateWidgetDimensions = ({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}): void => {
  if (!Number.isInteger(x) || x < 0) {
    throw new Error(
      "Widget x position must be an integer greater than or equal to 0"
    );
  }

  if (!Number.isInteger(y) || y < 0) {
    throw new Error(
      "Widget y position must be an integer greater than or equal to 0"
    );
  }

  if (!Number.isInteger(w) || w <= 0) {
    throw new Error(
      "Widget width must be an integer greater than 0"
    );
  }

  if (!Number.isInteger(h) || h <= 0) {
    throw new Error(
      "Widget height must be an integer greater than 0"
    );
  }
};

export const validateTextWidgetValue = (
  value: unknown
): TextWidgetValue => {
  if (!isRecord(value)) {
    throw new Error(
      "Text widget value must be an object"
    );
  }

  const text = value.text;
  const subtitle = value.subtitle;
  const variant = value.variant;
  const alignment = value.alignment;
  const colorFields = {
    textColor: value.textColor,
    backgroundColor: value.backgroundColor,
    accentColor: value.accentColor,
  };

  if (
    typeof text !== "string" ||
    text.trim().length === 0
  ) {
    throw new Error(
      "The text field is required for a TEXT widget"
    );
  }

  if (subtitle !== undefined && typeof subtitle !== "string") {
    throw new Error("Text widget subtitle must be a string");
  }

  for (const [name, color] of Object.entries(colorFields)) {
    if (
      color !== undefined &&
      (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))
    ) {
      throw new Error(`${name} must be a valid hexadecimal color`);
    }
  }

  if (
    variant !== undefined &&
    !TEXT_VARIANTS.includes(
      variant as TextWidgetVariant
    )
  ) {
    throw new Error(
      "Text widget variant must be TITLE, SUBTITLE or PARAGRAPH"
    );
  }

  if (
    alignment !== undefined &&
    !TEXT_ALIGNMENTS.includes(
      alignment as TextWidgetAlignment
    )
  ) {
    throw new Error(
      "Text widget alignment must be LEFT, CENTER or RIGHT"
    );
  }

  return {
    text: text.trim(),
    subtitle:
      typeof subtitle === "string" && subtitle.trim().length > 0
        ? subtitle.trim()
        : undefined,
    variant:
      (variant as TextWidgetVariant | undefined) ??
      "PARAGRAPH",
    alignment:
      (alignment as TextWidgetAlignment | undefined) ??
      "LEFT",
    textColor: (value.textColor as string | undefined) ?? "#111827",
    backgroundColor:
      (value.backgroundColor as string | undefined) ?? "#ffffff",
    accentColor: (value.accentColor as string | undefined) ?? "#84BF43",
  };
};

export const validateTextWidget = (
  value: unknown,
  chartTypeId?: string | null
): TextWidgetValue => {
  if (
    chartTypeId !== null &&
    chartTypeId !== undefined
  ) {
    throw new Error(
      "chartTypeId must be null for a TEXT widget"
    );
  }

  return validateTextWidgetValue(value);
};
