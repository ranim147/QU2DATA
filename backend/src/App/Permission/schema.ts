import { gql } from "apollo-server-express";

const schema = gql`
  type Permission {
    id: ID!
    name: String
    flag: String
  }

  type Query {
    getPermissions: [Permission]
      @hasPermission(flag: "roles", access: "can_show")
    getPermissionsDataForRole(roleId: String): [Permission]
      @hasPermission(flag: "roles", access: "can_show")
  }
`;

export default schema;
