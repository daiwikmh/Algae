const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "algopay_token";

let _token: string | null = null;
let _refreshing: Promise<string | null> | null = null;

export function setApiToken(token: string): void {
  _token = token;
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearApiToken(): void {
  _token = null;
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

export function loadStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !path.includes("/auth/")) {
    // deduplicate concurrent refresh calls
    if (!_refreshing) {
      _refreshing = refreshToken().finally(() => { _refreshing = null; });
    }
    const newToken = await _refreshing;
    if (newToken) {
      setApiToken(newToken);
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({ error: retry.statusText }));
        const msg = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
        throw new ApiError(retry.status, msg ?? retry.statusText);
      }
      return retry.json() as Promise<T>;
    }
    // refresh failed — clear token, let caller handle redirect
    _token = null;
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const msg = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
    throw new ApiError(res.status, msg ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
