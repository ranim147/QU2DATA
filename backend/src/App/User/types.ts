import { UserInstance } from "./model/user.model";
type AttributeType = "DATE" | "BOOLEAN" | "STRING" | "NUMBER";

export interface createUserInput {
  email: string;
  password: string;
}
export interface createUserByAdminInput {
  email: string;
  password: string;
  roleId: string;
}
export interface updateUserByAdminInput {
  email: string;
  password: string;
  roleId: string;
  userId: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
export interface RefreshTokenInput {
  token: string;
}
export interface SearchUserInput {
  param: string;
  value: string | number;
}

export interface UpdateArgs {
  userId: string;
  attribute: string;
  value: string;
  type_attribute: AttributeType;
}
export interface GetOptions {
  page?: number;
  limit?: number;
  filter?: {
    username: string;
    email: string;
  };
}
export interface GetUsersResponse {
  rows: UserInstance[];
  count: number;
}
