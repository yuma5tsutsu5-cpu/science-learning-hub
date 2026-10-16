import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getAuthSession, loginAdmin, logoutAdmin } from "../services/api";

type AuthContextValue = {
  authenticated: boolean;
  loading: boolean;
  csrfToken: string;
  login: (password: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    getAuthSession()
      .then((value) => {
        setAuthenticated(value.authenticated);
        setCsrfToken(value.csrf_token ?? "");
      })
      .catch(() => {
        setAuthenticated(false);
        setCsrfToken("");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(password: string, otp: string) {
    const value = await loginAdmin(password, otp);
    setAuthenticated(value.authenticated);
    setCsrfToken(value.csrf_token ?? "");
  }

  async function logout() {
    if (csrfToken) await logoutAdmin(csrfToken);
    setAuthenticated(false);
    setCsrfToken("");
  }

  return <AuthContext.Provider value={{ authenticated, loading, csrfToken, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
