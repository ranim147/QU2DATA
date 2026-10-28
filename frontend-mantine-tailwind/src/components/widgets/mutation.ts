import { gql } from "@apollo/client";
import { CreateWidgetInput, UpdateWidgetInput, Widget } from "./types";

export interface CreateWidgetData {
  createWidget: Widget;
}

export interface CreateWidgetVariables {
  input: CreateWidgetInput;
}

export interface UpdateWidgetData {
  updateWidget: Widget;
}

export interface UpdateWidgetVariables {
  id: string;
  input: UpdateWidgetInput;
}

export interface DeleteWidgetData {
  deleteWidget: boolean;
}

export interface DeleteWidgetVariables {
  id: string;
}

const WIDGET_FIELDS = gql`
  fragment WidgetFields on Widget {
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
`;

export const CREATE_WIDGET = gql`
  ${WIDGET_FIELDS}
  mutation CreateWidget($input: CreateWidgetInput!) {
    createWidget(input: $input) {
      ...WidgetFields
    }
  }
`;

export const UPDATE_WIDGET = gql`
  ${WIDGET_FIELDS}
  mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
    updateWidget(id: $id, input: $input) {
      ...WidgetFields
    }
  }
`;

export const DELETE_WIDGET = gql`
  mutation DeleteWidget($id: ID!) {
    deleteWidget(id: $id)
  }
`;
