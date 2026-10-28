import { gql } from "@apollo/client";

export const UPDATE_USER_ATTRIBUTE = gql`
  mutation UpdateUserAttribute(
    $userId: ID!
    $attribute: String!
    $value: String!
    $typeAttribute: AttributeType!
  ) {
    updateUserAttribute(
      userId: $userId
      attribute: $attribute
      value: $value
      type_attribute: $typeAttribute
    )
  }
`;
export const CREATE_USER_BY_ADMIN = gql`
  mutation CreateUserByAdmin(
    $email: String!
    $password: String!
    $roleId: ID!
  ) {
    createUserByAdmin(email: $email, password: $password, roleId: $roleId) {
      success
      message
    }
  }
`;
export const DELETE_USER_BY_ADMIN = gql`
  mutation DeleteUserByAdmin($userId: ID!) {
    deleteUserByAdmin(userId: $userId) {
      success
      message
    }
  }
`;
export const UPDATE_USER_BY_ADMIN = gql`
  mutation UpdateUserByAdmin(
    $email: String!
    $password: String!
    $roleId: ID!
    $userId: ID!
  ) {
    updateUserByAdmin(
      email: $email
      password: $password
      roleId: $roleId
      userId: $userId
    ) {
      success
    }
  }
`;
