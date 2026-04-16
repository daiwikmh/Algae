"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, setApiToken, clearApiToken, loadStoredToken } from "@/lib/api";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const USER_KEY = "algopay_user";

  function cachedUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  const [user, setUser] = useState<User | null>(cachedUser);
  const [ready, setReady] = useState(false);

  const AUTH_PATHS = ["/login", "/auth/callback"];

  const bootstrap = useCallback(async () => {
    if (AUTH_PATHS.includes(pathname)) {
      setReady(true);
      return;
    }
    const stored = loadStoredToken();
    if (stored) setApiToken(stored);
    try {
      // auto-refresh in api.ts handles an expired token via the httpOnly cookie
      const me = await api.get<User>("/auth/me");
      setUser(me);
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      }
    } catch {
      clearApiToken();
      setUser(null);
      if (typeof window !== "undefined") localStorage.removeItem(USER_KEY);
      router.replace("/login");
    } finally {
      setReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  useEffect(() => {
    bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {}
    clearApiToken();
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(USER_KEY);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, ready, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
