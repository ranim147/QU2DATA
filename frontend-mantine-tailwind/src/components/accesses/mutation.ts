import { gql } from "@apollo/client";

export const SAVE_ACCESS_MUTATION = gql`
  mutation SaveAccess($permissionId: String!, $roleId: ID!) {
    saveAccess(permissionId: $permissionId, roleId: $roleId) {
      message
      success
    }
  }
`;
export const UPDATE_ACCESS_MUTATION = gql`
  mutation UpdateAccess(
    $value: Boolean!
    $accessType: String!
    $accessId: ID!
  ) {
    updateAccess(value: $value, accessType: $accessType, accessId: $accessId) {
      message
      success
    }
  }
`;
