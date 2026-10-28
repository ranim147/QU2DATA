import { gql } from "apollo-server-express";

const schema = gql`
  enum PageFormat {
    A4
    A3
    A2
    A1
    A0
    LETTER
    LEGAL
    TABLOID
    SIXTEEN_NINE
    FOUR_THREE
    CUSTOM
  }

  type Page {
    id: ID!
    title: String
    format: PageFormat
    width: Int
    height: Int
    orderIndex: Int
    projectId: ID
    createdAt: String
    updatedAt: String
  }

  type PageResponse {
    success: Boolean
    message: String
    page: Page
  }

  type BasicPageResponse {
    success: Boolean
    message: String
  }

  type Query {
    getPages(projectId: ID!): [Page]
  }

  type Mutation {
    createPage(
      projectId: ID!
      title: String
      format: PageFormat
      width: Int
      height: Int
    ): PageResponse

    updatePage(
      pageId: ID!
      title: String
      format: PageFormat
      width: Int
      height: Int
      orderIndex: Int
    ): PageResponse

    deletePage(pageId: ID!): BasicPageResponse
  }
`;

export default schema;