import { gql } from "@apollo/client";

export const ADD_ROLE_MUTATION = gql`
  mutation CreateRole($roleName: String) {
    createRole(roleName: $roleName) {
      message
      success
    }
  }
`;
export const DELETE_ROLE_MUTATION = gql`
  mutation DeleteRole($roleId: String) {
    deleteRole(roleId: $roleId) {
      message
      success
    }
  }
`;
