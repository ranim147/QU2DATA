import { Access } from "./access.types";

export interface Role {
  id: string;
  roleName: string;
  accesses: [Access];
}
export interface RoleStatistics {
  role: Role;
  userCount: number;
  accessesCount: number;
}
