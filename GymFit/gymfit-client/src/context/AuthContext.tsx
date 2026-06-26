import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  getToken,
  setToken as persistToken,
  clearToken,
  getUserFromToken,
} from "@/lib/auth";
import type { AuthUser } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    getUserFromToken(getToken())
  );

  const login = useCallback((token: string) => {
    persistToken(token);
    setUser(getUserFromToken(token));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
