import { NextResponse, type NextRequest } from "next/server";

const OLD_HOST = "choreo-hq.vercel.app";
const NEW_ORIGIN = "https://tempohapp.vercel.app";

// Pages anyone can open, plus the files a phone needs to install the app.
const OPEN_PATHS = ["/welcome", "/guide", "/privacy", "/terms", "/api/demo", "/manifest.webmanifest"];
const OPEN_PREFIXES = ["/api/auth/", "/icon", "/apple-icon", "/opengraph-image", "/notion/"];

// A quick cookie check only. Each API route looks the session up for real.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The app moved from choreo-hq.vercel.app, so old links land on the same page at the new address.
  if (request.headers.get("host") === OLD_HOST) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, NEW_ORIGIN), 308);
  }
  const open = OPEN_PATHS.includes(pathname) || OPEN_PREFIXES.some((p) => pathname.startsWith(p));
  const hasPass = request.cookies.has("choreo_session") || request.cookies.has("choreo_demo");
  if (open || hasPass) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/welcome", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
