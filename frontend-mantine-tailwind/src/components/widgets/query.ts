import { gql } from "@apollo/client";
import { Widget, WidgetType } from "./types";

export interface GetWidgetTypesData {
  widgetTypes: WidgetType[];
}

export interface GetWidgetsData {
  widgets: Widget[];
}

export interface GetWidgetsVariables {
  pageId: string;
}

export const GET_WIDGET_TYPES = gql`
  query GetWidgetTypes {
    widgetTypes {
      id
      name
      description
    }
  }
`;

export const GET_WIDGETS = gql`
  query GetWidgets($pageId: ID) {
    widgets(pageId: $pageId) {
      id
      widgetTypeId
      x
      y
      w
      h
      value
      pageId
      chartTypeId
      widgetType {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;
