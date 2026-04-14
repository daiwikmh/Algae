"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setApiToken } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError("OAuth login failed. Please try again.");
      return;
    }

    api
      .post<{ accessToken: string }>("/auth/refresh", {})
      .then((data) => {
        setApiToken(data.accessToken);
        router.replace("/");
      })
      .catch(() => {
        setError("Failed to complete login. Please try again.");
      });
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141618] px-4">
      <div className="w-full max-w-sm rounded-md border border-slate-800 bg-[#1d1f22] p-8 text-center">
        {error ? (
          <>
            <p className="mb-4 text-rose-400">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-[#f2ad2d]" />
            <p className="text-sm text-slate-400">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
