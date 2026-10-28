import { Nodes } from "../../helpers/types";
import { User } from "../../types/user.type";

export interface GetUsersData {
  getUsers: Nodes<User>;
}
type AttributeType = "DATE" | "BOOLEAN" | "STRING" | "NUMBER";

export interface updateUserArgs {
  userId: number;
  attribute: string;
  value: string;
  typeAttribute: AttributeType;
}

export interface CreateUserByAdminResponse {
  createUserByAdmin: CreateUserByAdmin;
}
export interface UpdateUserByAdminResponse {
  updateUserByAdmin: UpdateUserByAdmin;
}
interface CreateUserByAdmin {
  message: string;
  success: boolean;
}
interface UpdateUserByAdmin {
  success: boolean;
}
