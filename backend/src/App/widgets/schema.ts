import { gql } from "apollo-server-express";

export default gql`
  scalar JSON

  type WidgetType {
    id: ID!
    name: String!
    description: String
    createdAt: String!
    updatedAt: String!
  }

  type Widget {
    id: ID!
    widgetTypeId: ID!

    x: Int!
    y: Int!
    w: Int!
    h: Int!

    value: JSON!

    pageId: ID
    chartTypeId: ID

    widgetType: WidgetType

    createdAt: String!
    updatedAt: String!
  }

  input CreateWidgetInput {
    widgetTypeId: ID!

    x: Int!
    y: Int!
    w: Int!
    h: Int!

    value: JSON!

    pageId: ID
    chartTypeId: ID
  }

  input UpdateWidgetInput {
    x: Int
    y: Int
    w: Int
    h: Int

    value: JSON

    pageId: ID
    chartTypeId: ID
  }

  extend type Query {
    widgetTypes: [WidgetType!]!

    widgets(
      pageId: ID
      widgetTypeId: ID
    ): [Widget!]!

    widget(id: ID!): Widget!
  }

  extend type Mutation {
    createWidget(
      input: CreateWidgetInput!
    ): Widget!

    updateWidget(
      id: ID!
      input: UpdateWidgetInput!
    ): Widget!

    deleteWidget(id: ID!): Boolean!
  }
`;
