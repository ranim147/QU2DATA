import { RoleInstance } from "./model/role.model";

export interface createRoleInput {
  roleName: string;
}
export interface CreateRoleResponse {
  role: RoleInstance;
  message: string;
  success: boolean;
}
export interface deleteRoleInput {
  roleId: string;
}
export interface DeleteResponse {
  message: string;
  success: boolean;
}
