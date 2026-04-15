const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Token is held in memory only — set by auth context after wallet signature verification
let _token: string | null = null;

export function setApiToken(token: string): void {
  _token = token;
}

export function clearApiToken(): void {
  _token = null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
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

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
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
