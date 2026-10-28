import { gql } from "@apollo/client";
import { Permission } from "../../types/permission.types";

export const GET_PERMISSIONS = gql`
  query GetPermissions {
    getPermissions {
      name
      flag
      id
    }
  }
`;
export const GET_PERMISSIONS_FOR_ROLE = gql`
  query GetPermissionsDataForRole($roleId: String) {
    getPermissionsDataForRole(roleId: $roleId) {
      id
      name
      flag
    }
  }
`;
export interface GetPermissionsData {
  getPermissions: Permission[];
}
export interface GetPermissionsDataForRole {
  getPermissionsDataForRole: Permission[];
}
