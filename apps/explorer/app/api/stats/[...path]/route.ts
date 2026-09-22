import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the password-gated statistics page. The Rango
// scanner credentials stay in server env vars and never reach the browser.
//
// Env vars (server-only, no NEXT_PUBLIC_ prefix):
//   RANGO_API_KEY       — Rango API key
//   RANGO_SECRET_TOKEN  — Rango scanner token
//   RANGO_BASE_URL      — optional override (default https://api.rango.exchange)

const ALLOWED_PREFIXES = ["scanner/summary/", "scanner/summary/daily", "meta/"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const subPath = (path ?? []).join("/");

  const isAllowed = ALLOWED_PREFIXES.some((p) => subPath.startsWith(p));
  if (!isAllowed) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.RANGO_API_KEY;
  const token = process.env.RANGO_SECRET_TOKEN;
  if (!apiKey || !token) {
    return NextResponse.json({ message: "Statistics not configured" }, { status: 500 });
  }

  const base = process.env.RANGO_BASE_URL || "https://api.rango.exchange";

  // Forward only the query params we expect, never the raw query object.
  const forward = ["days", "breakDownBy", "source", "destination"];
  const qs = new URLSearchParams();
  for (const key of forward) {
    const value = req.nextUrl.searchParams.get(key);
    if (value && value.length <= 64) qs.set(key, value);
  }
  qs.set("apiKey", apiKey);
  qs.set("token", token);

  try {
    const upstream = await fetch(`${base}/${subPath}?${qs.toString()}`, {
      headers: { Accept: "application/json" },
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Stats proxy error:", error);
    return NextResponse.json({ message: "Upstream unavailable" }, { status: 502 });
  }
}
