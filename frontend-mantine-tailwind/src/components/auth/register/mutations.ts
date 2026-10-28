import { gql } from "@apollo/client";

export const RegisterMutation = gql`
  mutation Mutation($email: String!, $password: String!) {
    createUser(email: $email, password: $password) {
      token
      refreshToken
      success
      message
      user {
        user_name
        isBanned
        isActive
      }
    }
  }
`;
