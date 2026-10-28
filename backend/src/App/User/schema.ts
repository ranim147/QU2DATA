import { gql } from "apollo-server-express";

const schema = gql`
  type User {
    id: ID!
    email: String
    password: String
    isActive: Boolean
    isBanned: Boolean
    requested_token: String
    requested_tokenAt: String
    user_agent: String
    user_name: String
    lastLogin: String
    Role: Role
  }
  input UserFilterInput {
    id: ID
    email: String
    password: String
    isActive: Boolean
    isBanned: Boolean
    requested_token: String
    requested_tokenAt: String
    user_agent: String
    user_name: String
    lastLogin: String
  }

  enum AttributeType {
    DATE
    BOOLEAN
    FLOAT
    STRING
    NUMBER
    # Add more types as needed
  }
  type Mutation {
    createUser(email: String!, password: String!): LoginUserResponse!
    SendEmailValidation: BasicResponse! @auth
    ValidateEmail(token: String!): BasicResponse!
    Login(email: String, password: String!): LoginUserResponse!
    LoginWithToken: LoginUserResponse! @auth
    RefreshToken(token: String!): LoginUserResponse!
    updateUserAttribute(
      userId: ID!
      attribute: String!
      value: String!
      type_attribute: AttributeType!
    ): Boolean! @hasPermission(flag: "users", access: "can_update")
    createUserByAdmin(
      email: String!
      password: String!
      roleId: ID!
    ): CreateUserResponse @hasPermission(flag: "users", access: "can_create")
    updateUserByAdmin(
      email: String!
      password: String!
      roleId: ID!
      userId: ID!
    ): UpdateUserResponse @hasPermission(flag: "users", access: "can_update")
    deleteUserByAdmin(userId: ID!): BasicResponse
      @hasPermission(flag: "users", access: "can_delete")
  }
  type Query {
    Me: User @auth
    getUsers(
      page: Int = 1
      limit: Int = 10
      filter: UserFilterInput
    ): GetUsersResponse @hasPermission(flag: "users", access: "can_show")
  }

  type CreateUserResponse {
    message: String
    user: User
    success: Boolean
  }
  type GetUsersResponse {
    rows: [User]
    count: Int
  }
  type UpdateUserResponse {
    message: String
    user: User
    success: Boolean
  }
  type LoginUserResponse {
    success: Boolean
    user: User
    message: String
    token: String
    refreshToken: String
  }
  type BasicResponse {
    success: Boolean
    message: String
  }
  type getUsersResponse {
    success: Boolean
    message: String
    Users: [User]
  }
`;

export default schema;
