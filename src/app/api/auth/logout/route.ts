import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, SESSION_COOKIE, endSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await endSession(token).catch((err) => console.error(err));
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
