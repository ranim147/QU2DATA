import {
  createWidget,
  deleteWidget,
  getWidgetById,
  getWidgets,
  getWidgetTypes,
  updateWidget,
} from "./service";
import {
  CreateWidgetInput,
  UpdateWidgetInput,
  WidgetFilters,
} from "./types";

const resolvers = {
  Query: {
    widgetTypes: async () => getWidgetTypes(),

    widgets: async (_: unknown, filters: WidgetFilters) =>
      getWidgets(filters),

    widget: async (_: unknown, { id }: { id: string }) =>
      getWidgetById(id),
  },

  Mutation: {
    createWidget: async (
      _: unknown,
      { input }: { input: CreateWidgetInput }
    ) => createWidget(input),

    updateWidget: async (
      _: unknown,
      {
        id,
        input,
      }: { id: string; input: UpdateWidgetInput }
    ) => updateWidget(id, input),

    deleteWidget: async (
      _: unknown,
      { id }: { id: string }
    ) => deleteWidget(id),
  },
};

export default resolvers;
