import { NextResponse } from "next/server";
import { randomToken } from "@/lib/secrets";
import { DEMO_COOKIE, cookieOptions } from "@/lib/session";

// Starts a private demo with sample data. No account or Notion needed.
export function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(DEMO_COOKIE, randomToken(), cookieOptions(60 * 60 * 24 * 7));
  return res;
}
