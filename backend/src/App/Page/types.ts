export type PageFormat =
  | "A4"
  | "A3"
  | "A2"
  | "A1"
  | "A0"
  | "LETTER"
  | "LEGAL"
  | "TABLOID"
  | "SIXTEEN_NINE"
  | "FOUR_THREE"
  | "CUSTOM";

export interface GetPagesInput {
  projectId: string;
}

export interface CreatePageInput {
  projectId: string;
  title?: string;
  format?: PageFormat;
  width?: number;
  height?: number;
}

export interface UpdatePageInput {
  pageId: string;
  title?: string;
  format?: PageFormat;
  width?: number;
  height?: number;
  orderIndex?: number;
}

export interface DeletePageInput {
  pageId: string;
}