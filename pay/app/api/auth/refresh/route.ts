import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  try {
    const res = await fetch(`${BACKEND}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify({}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const response = NextResponse.json(data, { status: 200 });

    // forward Set-Cookie from backend so the httpOnly refresh token rotates
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);

    return response;
  } catch {
    return NextResponse.json({ error: "refresh_failed" }, { status: 500 });
  }
}
