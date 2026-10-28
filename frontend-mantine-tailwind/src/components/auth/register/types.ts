import { User } from "../../../types/user.type";

export interface UserRegister {
  user: User;
  token: string;
  refreshToken: string;
  message: string;
  success: boolean;
}
export interface UserRegisterResponse {
  createUser: UserRegister;
}
