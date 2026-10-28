import { gql } from "apollo-server-express";

const schema = gql`
  type Access {
    id: ID!
    permissionId: ID
    roleId: ID
    isFullAccess: Boolean
    can_create: Boolean
    can_delete: Boolean
    can_update: Boolean
    can_show: Boolean
    can_show_own: Boolean
    Permission: Permission
  }
  type saveAccessResponse {
    message: String
    success: Boolean
  }
  type Mutation {
    saveAccess(permissionId: String!, roleId: ID!): saveAccessResponse!
      @hasPermission(flag: "roles", access: "can_update")
    updateAccess(
      value: Boolean!
      accessType: String!
      accessId: ID!
    ): saveAccessResponse! @hasPermission(flag: "roles", access: "can_update")
  }
`;

export default schema;
