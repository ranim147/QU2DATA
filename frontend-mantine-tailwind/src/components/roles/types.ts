import { Role, RoleStatistics } from "../../types/role.types";

export interface GetRolesData {
  getRoles: Role[];
}

export interface GET_ROLE_STATISTICS {
  getStatics: RoleStatistics;
}
