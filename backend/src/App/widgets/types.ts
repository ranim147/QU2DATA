export type TextWidgetVariant =
  | "TITLE"
  | "SUBTITLE"
  | "PARAGRAPH";

export type TextWidgetAlignment =
  | "LEFT"
  | "CENTER"
  | "RIGHT";

export interface TextWidgetValue
  extends Record<string, unknown> {
  text: string;
  subtitle?: string;
  variant?: TextWidgetVariant;
  alignment?: TextWidgetAlignment;
  textColor?: string;
  backgroundColor?: string;
  accentColor?: string;
}

export interface CreateWidgetInput {
  widgetTypeId: string;

  x: number;
  y: number;
  w: number;
  h: number;

  value: Record<string, unknown>;

  pageId?: string | null;
  chartTypeId?: string | null;
}

export interface UpdateWidgetInput {
  x?: number;
  y?: number;
  w?: number;
  h?: number;

  value?: Record<string, unknown>;

  pageId?: string | null;
  chartTypeId?: string | null;
}

export interface WidgetFilters {
  pageId?: string | null;
  widgetTypeId?: string;
}
