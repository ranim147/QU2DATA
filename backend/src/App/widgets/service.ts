import Widget from "./model/widget.model";
import WidgetType from "./model/widget-type.model";

import {
  CreateWidgetInput,
  UpdateWidgetInput,
  WidgetFilters,
} from "./types";

import {
  validateTextWidget,
  validateWidgetDimensions,
} from "./validators";

export const getWidgetTypes = async () => {
  return WidgetType.findAll({
    order: [["name", "ASC"]],
  });
};

export const getWidgetTypeById = async (
  id: string
) => {
  const widgetType = await WidgetType.findByPk(id);

  if (!widgetType) {
    throw new Error("Widget type not found");
  }

  return widgetType;
};

export const getWidgets = async (
  filters: WidgetFilters = {}
) => {
  const where: Record<string, unknown> = {};

  if (filters.pageId !== undefined) {
    where.pageId = filters.pageId;
  }

  if (filters.widgetTypeId !== undefined) {
    where.widgetTypeId = filters.widgetTypeId;
  }

  return Widget.findAll({
    where,
    include: [
      {
        model: WidgetType,
        as: "widgetType",
      },
    ],
    order: [
      ["y", "ASC"],
      ["x", "ASC"],
      ["createdAt", "ASC"],
    ],
  });
};

export const getWidgetById = async (
  id: string
) => {
  const widget = await Widget.findByPk(id, {
    include: [
      {
        model: WidgetType,
        as: "widgetType",
      },
    ],
  });

  if (!widget) {
    throw new Error("Widget not found");
  }

  return widget;
};

export const createWidget = async (
  input: CreateWidgetInput
) => {
  validateWidgetDimensions({
    x: input.x,
    y: input.y,
    w: input.w,
    h: input.h,
  });

  const widgetType = await getWidgetTypeById(
    input.widgetTypeId
  );

  if (
    widgetType.name === "CHART" &&
    !input.chartTypeId
  ) {
    throw new Error(
      "chartTypeId is required for a CHART widget"
    );
  }

  const normalizedValue =
    widgetType.name === "TEXT"
      ? validateTextWidget(input.value, input.chartTypeId)
      : input.value;

  const widget = await Widget.create({
    widgetTypeId: input.widgetTypeId,

    x: input.x,
    y: input.y,
    w: input.w,
    h: input.h,

    value: normalizedValue,

    pageId: input.pageId ?? null,
    chartTypeId:
      widgetType.name === "TEXT"
        ? null
        : input.chartTypeId,
  });

  return getWidgetById(widget.id);
};

export const updateWidget = async (
  id: string,
  input: UpdateWidgetInput
) => {
  const widget = await getWidgetById(id);

  const widgetType = await getWidgetTypeById(
    widget.widgetTypeId
  );

  const nextChartTypeId =
    input.chartTypeId !== undefined
      ? input.chartTypeId
      : widget.chartTypeId;

  if (
    widgetType.name === "CHART" &&
    !nextChartTypeId
  ) {
    throw new Error(
      "chartTypeId is required for a CHART widget"
    );
  }

  const nextX =
    input.x !== undefined ? input.x : widget.x;

  const nextY =
    input.y !== undefined ? input.y : widget.y;

  const nextW =
    input.w !== undefined ? input.w : widget.w;

  const nextH =
    input.h !== undefined ? input.h : widget.h;

  validateWidgetDimensions({
    x: nextX,
    y: nextY,
    w: nextW,
    h: nextH,
  });
  const nextValue =
    input.value !== undefined
      ? input.value
      : widget.value;

  const normalizedValue =
    widgetType.name === "TEXT"
      ? validateTextWidget(nextValue, nextChartTypeId)
      : nextValue;

  await widget.update({
    x: nextX,
    y: nextY,
    w: nextW,
    h: nextH,
    value: normalizedValue,
    pageId:
      input.pageId !== undefined
        ? input.pageId
        : widget.pageId,
    chartTypeId:
      widgetType.name === "TEXT"
        ? null
        : nextChartTypeId,
  });
  return getWidgetById(widget.id);
};

export const deleteWidget = async (
  id: string
): Promise<boolean> => {
  const widget = await getWidgetById(id);

  await widget.destroy();

  return true;
};

export const seedWidgetTypes =
  async (): Promise<void> => {
    await WidgetType.findOrCreate({
      where: {
        name: "TEXT",
      },
      defaults: {
        name: "TEXT",
        description:
          "Widget containing text content",
      },
    });

    await WidgetType.findOrCreate({
      where: {
        name: "CHART",
      },
      defaults: {
        name: "CHART",
        description:
          "Widget containing a chart",
      },
    });
  };
