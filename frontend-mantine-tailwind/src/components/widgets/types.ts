export type TextWidgetVariant = "TITLE" | "SUBTITLE" | "PARAGRAPH";
export type TextWidgetAlignment = "LEFT" | "CENTER" | "RIGHT";

export interface WidgetType {
  id: string;
  name: "TEXT" | "CHART";
  description: string | null;
}

export interface TextWidgetValue {
  text: string;
  subtitle?: string;
  variant: TextWidgetVariant;
  alignment: TextWidgetAlignment;
  textColor?: string;
  backgroundColor?: string;
  accentColor?: string;
}

export interface Widget {
  id: string;
  widgetTypeId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  value: TextWidgetValue;
  pageId: string | null;
  chartTypeId: string | null;
  widgetType: WidgetType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetInput {
  widgetTypeId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  value: TextWidgetValue;
  pageId: string | null;
  chartTypeId: string | null;
}

export interface UpdateWidgetInput {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  value?: TextWidgetValue;
  pageId?: string | null;
  chartTypeId?: string | null;
}
