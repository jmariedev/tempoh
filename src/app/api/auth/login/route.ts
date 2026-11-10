import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/notion-auth";
import { randomToken } from "@/lib/secrets";
import { STATE_COOKIE, cookieOptions } from "@/lib/session";

// Sends the browser to Notion to approve access. The state value guards against forged sign-ins.
export function GET(request: Request) {
  const state = randomToken();
  try {
    const res = NextResponse.redirect(authorizeUrl(request, state));
    res.cookies.set(STATE_COOKIE, state, cookieOptions(60 * 10));
    return res;
  } catch {
    return NextResponse.redirect(new URL("/welcome?error=setup", request.url));
  }
}
