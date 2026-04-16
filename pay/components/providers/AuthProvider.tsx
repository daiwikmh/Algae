"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, setApiToken, clearApiToken } from "@/lib/api";

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

const AUTH_PATHS = ["/login", "/auth/callback"];

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const bootstrap = useCallback(async () => {
    if (AUTH_PATHS.includes(pathname)) {
      setReady(true);
      return;
    }
    try {
      const data = await api.post<{ accessToken: string }>("/auth/refresh", {});
      setApiToken(data.accessToken);
      const me = await api.get<User>("/auth/me");
      setUser(me);
    } catch {
      clearApiToken();
      setUser(null);
      router.replace("/login");
    } finally {
      setReady(true);
    }
  }, [pathname, router]);

  useEffect(() => {
    bootstrap();
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {}
    clearApiToken();
    setUser(null);
    router.replace("/login");
  }, [router]);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, ready, logout }}>
      {children}
    </AuthContext.Provider>
  );
}