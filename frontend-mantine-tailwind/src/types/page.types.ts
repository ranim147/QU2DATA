export type PageFormat =
  | "A4" | "A3" | "A2" | "A1" | "A0"
  | "LETTER" | "LEGAL" | "TABLOID"
  | "SIXTEEN_NINE" | "FOUR_THREE"
  | "CUSTOM";

export interface Page {
  id: string;
  title: string;
  format: PageFormat;
  width: number;
  height: number;
  orderIndex: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}