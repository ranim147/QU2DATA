import { gql } from "@apollo/client";

export const QUERY_GET_ROLES = gql`
  query GetRoles {
    getRoles {
      id
      roleName
    }
  }
`;

export const QUERY_GET_ROLE_STATISTICS = gql`
  query Query($roleId: String) {
    getStatics(roleID: $roleId) {
      role {
        roleName
        accesses {
          isFullAccess
          can_create
          can_delete
          can_update
          can_show
          can_show_own
          Permission {
            name
            flag
          }
          id
        }
        id
      }
      userCount
      accessesCount
    }
  }
`;
