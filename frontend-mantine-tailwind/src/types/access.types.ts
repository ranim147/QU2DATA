import { Permission } from "./permission.types";

export interface Access {
  id: string;
  isFullAccess: boolean;
  can_create: boolean;
  can_delete: boolean;
  can_update: boolean;
  can_show: boolean;
  can_show_own: boolean;
  Permission: Permission;
}
