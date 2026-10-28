import { gql } from "@apollo/client";

export const Me = gql`
  query Query {
    Me {
      email
      Role {
        roleName
      }
      isActive
      isBanned
    }
  }
`;
