import { z } from "zod";
import { PAGE_FORMAT_VALUES } from "./constants";

const uuid = z.string().uuid();

// z.enum a besoin d'un tuple non-vide typé, d'où le cast
const pageFormatEnum = z.enum(
  PAGE_FORMAT_VALUES as [string, ...string[]]
);

export const getPagesInputSchema = z.object({
  projectId: uuid,
});

export const createPageInputSchema = z.object({
  projectId: uuid,
  title: z.string().optional(),
  format: pageFormatEnum.optional(),
  width: z.number().int().min(100).max(10000).optional(),
  height: z.number().int().min(100).max(10000).optional(),
});

export const updatePageInputSchema = z.object({
  pageId: uuid,
  title: z.string().optional(),
  format: pageFormatEnum.optional(),
  width: z.number().int().min(100).max(10000).optional(),
  height: z.number().int().min(100).max(10000).optional(),
  orderIndex: z.number().int().optional(),
});

export const deletePageInputSchema = z.object({
  pageId: uuid,
});