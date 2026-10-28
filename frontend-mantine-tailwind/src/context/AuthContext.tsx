import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { gql, useMutation } from "@apollo/client";
import Cookies from "universal-cookie";
import { User } from "../types/user.type";
import { clearLastProjectId } from "../utils/lastProject";
import { clearLastFileId } from "../utils/lastFile";

const ACCESS_TOKEN_COOKIE = "quDataSenseToken";
const REFRESH_TOKEN_COOKIE = "qu2control_refresh_token";

interface Login {
  token: string;
  refreshToken?: string;
  user: User;
}
interface AuthContext {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  token: string;
  setLocalToken: (token?: string) => void;
  logout: () => void;
  loading: boolean;
  handleLoginData: (data: Login) => void;
}
interface UseAuthContext extends AuthContext {
  authHeader: () => {
    authorization?: string;
  };
  handleLogin: (token: string, user: User) => void;
}
interface AuthContextProviderProps {
  children: ReactNode;
}

const USER_FIELDS = `
  user_name
  isBanned
  isActive
  Role {
    id
    roleName
    accesses {
      id
      permissionId
      roleId
      isFullAccess
      can_create
      can_delete
      can_update
      can_show
      can_show_own
      Permission {
        id
        name
        flag
      }
    }
  }
`;

const SignInWithTokenMutation = gql`
  mutation LoginWithToken {
    LoginWithToken {
      success
      user { ${USER_FIELDS} }
      message
      token
      refreshToken
    }
  }
`;

const RefreshTokenMutation = gql`
  mutation RefreshToken($token: String!) {
    RefreshToken(token: $token) {
      success
      user { ${USER_FIELDS} }
      message
      token
      refreshToken
    }
  }
`;

const cookies = new Cookies();

const AuthContext = createContext<AuthContext | null>(null);
export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [signInWithToken, { loading }] = useMutation(SignInWithTokenMutation);
  const [doRefreshToken] = useMutation(RefreshTokenMutation);

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");

  const setLocalToken = (_token?: string) => {
    if (_token) {
      cookies.set(ACCESS_TOKEN_COOKIE, _token.replace("Bearer ", ""), {
        path: "/",
      });
      if (_token !== token) {
        setToken(_token);
      }
    } else {
      cookies.set(ACCESS_TOKEN_COOKIE, "", {
        expires: new Date(0),
        path: "/",
      });
    }
  };

  const setLocalRefreshToken = (_token?: string) => {
    if (_token) {
      cookies.set(REFRESH_TOKEN_COOKIE, _token, { path: "/" });
    } else {
      cookies.set(REFRESH_TOKEN_COOKIE, "", {
        expires: new Date(0),
        path: "/",
      });
    }
  };

 const logout = () => {
  setLocalToken();
  setLocalRefreshToken();
  clearLastProjectId();
  clearLastFileId();
  setUser(null);
  setToken("");
  window.location.href = "/";
};

  const handleLoginData = (loginData: Login) => {
    if (loginData) {
      const { token, refreshToken: rt, user } = loginData;
      setLocalToken(token);
      if (rt) setLocalRefreshToken(rt);
      setUser(user);
    }
  };

  useEffect(() => {
    const localToken =
      typeof window !== "undefined" && cookies.get(ACCESS_TOKEN_COOKIE);

    if (!localToken) return;

    signInWithToken()
      .then(({ data }) => {
        handleLoginData(data?.LoginWithToken || null);
      })
      .catch(() => {
        // Access token expired — try rotating with the refresh token
        const storedRefreshToken =
          typeof window !== "undefined" &&
          cookies.get(REFRESH_TOKEN_COOKIE);

        if (!storedRefreshToken) {
          logout();
          return;
        }

        doRefreshToken({ variables: { token: storedRefreshToken } })
          .then(({ data }) => {
            const result = data?.RefreshToken;
            if (result?.success) {
              handleLoginData(result);
            } else {
              logout();
            }
          })
          .catch(() => logout());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setLocalToken,
        logout,
        loading,
        handleLoginData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): UseAuthContext {
  const state = useContext(AuthContext);

  if (!state) {
    throw new Error("useAuthContext must be used within a AuthContextProvider");
  }

  const authHeader = () => {
    let token = null;
    if (typeof window !== "undefined") {
      token = cookies.get(ACCESS_TOKEN_COOKIE) || null;
    }
    if (!token) return {};
    return {
      authorization: `Bearer ${token}`,
    };
  };

  const handleLogin = (token: string, user: User) => {
    state.setUser(user);
    state.setLocalToken(token);
  };

  return { ...state, authHeader, handleLogin };
}

export default AuthContext;
