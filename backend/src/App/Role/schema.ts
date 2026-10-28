import { gql } from "apollo-server-express";

const schema = gql`
  type Role {
    id: ID!
    roleName: String
    accesses: [Access]
  }
  type RoleStatic {
    role: Role
    userCount: Int
    accessesCount: Int
  }

  type CreateRoleResponse {
    message: String
    role: Role
    success: Boolean
  }
  type DeleteRoleResponse {
    message: String
    success: Boolean
  }
  type Query {
    getRoles: [Role] @hasPermission(flag: "roles", access: "can_show")
    getStatics(roleID: String): RoleStatic
      @hasPermission(flag: "roles", access: "can_show")
  }
  type Mutation {
    createRole(roleName: String): CreateRoleResponse
      @hasPermission(flag: "roles", access: "can_create")
    deleteRole(roleId: String): DeleteRoleResponse
      @hasPermission(flag: "roles", access: "can_delete")
  }
`;

export default schema;
