import { User } from "../../../types/user.type";

export interface UserLogin {
  user: User;
  token: string;
  refreshToken: string;
  message: string;
  success: boolean;
}
export interface UserLoginResponse {
  Login: UserLogin;
}
export interface UserLoginWithToken {
  LoginWithToken: UserLogin;
}
