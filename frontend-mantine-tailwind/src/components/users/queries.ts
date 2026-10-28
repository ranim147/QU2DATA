import { gql } from "@apollo/client";

export const QUERY_GET_USERS = gql`
  query GetUsers($page: Int, $limit: Int, $filter: UserFilterInput) {
    getUsers(page: $page, limit: $limit, filter: $filter) {
      rows {
        id
        email
        isActive
        isBanned
        user_name
        lastLogin
        Role {
          id
          roleName
        }
      }
      count
    }
  }
`;
