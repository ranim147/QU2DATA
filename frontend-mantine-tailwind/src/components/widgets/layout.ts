import { Page } from "../../types/page.types";
import { Widget } from "./types";

export const WIDGET_LAYOUT = {
  columns: 12,
  left: 24,
  top: 96,
  right: 24,
  bottom: 24,
  gap: 16,
  rowHeight: 60,
} as const;

interface Position {
  x: number;
  y: number;
}

interface Placement extends Position {
  w: number;
  h: number;
}

interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function widgetColumnWidth(page: Pick<Page, "width">): number {
  const contentWidth = page.width - WIDGET_LAYOUT.left - WIDGET_LAYOUT.right;
  return (
    (contentWidth - WIDGET_LAYOUT.gap * (WIDGET_LAYOUT.columns - 1)) /
    WIDGET_LAYOUT.columns
  );
}

export function widgetLeft(page: Pick<Page, "width">, x: number): number {
  return (
    WIDGET_LAYOUT.left +
    x * (widgetColumnWidth(page) + WIDGET_LAYOUT.gap)
  );
}

export function widgetTop(y: number): number {
  return WIDGET_LAYOUT.top + y * (WIDGET_LAYOUT.rowHeight + WIDGET_LAYOUT.gap);
}

export function widgetWidth(page: Pick<Page, "width">, w: number): number {
  return w * widgetColumnWidth(page) + (w - 1) * WIDGET_LAYOUT.gap;
}

export function widgetHeight(h: number): number {
  return h * WIDGET_LAYOUT.rowHeight + (h - 1) * WIDGET_LAYOUT.gap;
}

function rectangle(
  page: Pick<Page, "width">,
  placement: Placement
): Rectangle {
  const left = widgetLeft(page, placement.x);
  const top = widgetTop(placement.y);
  return {
    left,
    top,
    right: left + widgetWidth(page, placement.w),
    bottom: top + widgetHeight(placement.h),
  };
}

function overlaps(first: Rectangle, second: Rectangle): boolean {
  return !(
    first.right + WIDGET_LAYOUT.gap <= second.left ||
    first.left >= second.right + WIDGET_LAYOUT.gap ||
    first.bottom + WIDGET_LAYOUT.gap <= second.top ||
    first.top >= second.bottom + WIDGET_LAYOUT.gap
  );
}

export function isWidgetPositionValid(
  page: Pick<Page, "width" | "height">,
  widgets: Pick<Widget, "x" | "y" | "w" | "h">[],
  placement: Placement
): boolean {
  if (
    placement.x < 0 ||
    placement.y < 0 ||
    placement.w < 1 ||
    placement.h < 1 ||
    placement.x + placement.w > WIDGET_LAYOUT.columns
  ) {
    return false;
  }

  const candidate = rectangle(page, placement);
  const insidePage = candidate.bottom <= page.height - WIDGET_LAYOUT.bottom;

  return (
    insidePage &&
    !widgets.some((widget) => overlaps(candidate, rectangle(page, widget)))
  );
}

export function findAvailableWidgetPosition(
  page: Pick<Page, "width" | "height">,
  widgets: Pick<Widget, "x" | "y" | "w" | "h">[],
  rawWidth: number,
  h: number
): Position | null {
  const w = Math.min(Math.max(rawWidth, 1), WIDGET_LAYOUT.columns);
  const maxY = Math.floor(
    (page.height - WIDGET_LAYOUT.top - WIDGET_LAYOUT.bottom - widgetHeight(h)) /
      (WIDGET_LAYOUT.rowHeight + WIDGET_LAYOUT.gap)
  );

  if (maxY < 0) return null;

  for (let y = 0; y <= maxY; y += 1) {
    for (let x = 0; x <= WIDGET_LAYOUT.columns - w; x += 1) {
      if (isWidgetPositionValid(page, widgets, { x, y, w, h })) return { x, y };
    }
  }

  return null;
}

export function compactWidgetLayout<T extends Pick<Widget, "x" | "y" | "w" | "h">>(
  page: Pick<Page, "width" | "height">,
  widgets: T[]
): T[] {
  const compacted: T[] = [];
  const ordered = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);

  for (const widget of ordered) {
    const w = Math.min(Math.max(widget.w, 1), WIDGET_LAYOUT.columns);
    const position = findAvailableWidgetPosition(page, compacted, w, widget.h);
    compacted.push(position ? { ...widget, ...position, w } : { ...widget, w });
  }

  return compacted;
}
