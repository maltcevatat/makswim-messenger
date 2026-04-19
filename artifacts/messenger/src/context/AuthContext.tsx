import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { api, type Me } from "@/api";

interface AuthCtx {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
