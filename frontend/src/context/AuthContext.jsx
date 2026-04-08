import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, setAccessToken, clearAccessToken, getAccessToken } from "@/lib/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while checking existing session

  // ── On mount: if we have a stored token, fetch the user profile ────────────
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authApi.getMe()
        .then((data) => setUser(data.user))
        .catch(() => clearAccessToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Listen for forced logout (token expired & refresh failed) ─────────────
  useEffect(() => {
    const handle = () => { setUser(null); clearAccessToken(); };
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, phone, role }) => {
    await authApi.register({ name, email, password, phone, role });
    // Registration doesn't auto-login per the API docs — just succeeds
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    // Fetch full profile after login
    const me = await authApi.getMe();
    setUser(me.user);
    return me.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};