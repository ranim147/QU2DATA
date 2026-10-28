import { gql } from "@apollo/client";

export const LoginMutation = gql`
  mutation Mutation($password: String!, $email: String) {
    Login(password: $password, email: $email) {
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
