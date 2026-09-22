import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// Server-side password check for the statistics page. The password lives in
// the STATS_PASSWORD env var and is never shipped to the browser.

export async function POST(req: NextRequest) {
  const expected = process.env.STATS_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, message: "Not configured" }, { status: 500 });
  }

  let provided = "";
  try {
    const body = await req.json();
    if (typeof body?.password === "string") provided = body.password;
  } catch {
    // malformed body — provided stays empty and the check fails below
  }

  // Constant-time comparison to avoid timing leaks.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
