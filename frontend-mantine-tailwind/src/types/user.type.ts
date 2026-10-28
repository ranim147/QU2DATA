import { Role } from "./role.types";

export interface User {
  id: string;
  email: string;
  isActive: boolean;
  isBanned: boolean;
  user_name: string;
  lastLogin: string;
  Role: Role;
}
