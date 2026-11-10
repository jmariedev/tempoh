import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, findDataSources } from "@/lib/notion-auth";
import { sameString } from "@/lib/compare";
import {
  DEMO_COOKIE,
  SESSION_COOKIE,
  STATE_COOKIE,
  createSession,
  saveAccount,
  sessionCookieOptions,
} from "@/lib/session";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Notion sends people back here after they approve (or cancel) access.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/welcome?error=${reason}`, request.url));
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  const expected = request.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!expected || !sameString(expected, params.get("state") ?? "")) return fail("state");
  if (params.get("error")) return fail("cancelled");
  const code = params.get("code");
  if (!code) return fail("cancelled");

  try {
    const token = await exchangeCode(request, code);
    // A freshly copied template can take a moment to show up in search.
    let dataSources = null;
    for (let attempt = 0; attempt < 15 && !dataSources; attempt++) {
      if (attempt > 0) await sleep(2000);
      dataSources = await findDataSources(token.access_token, token.duplicated_template_id);
    }
    if (!dataSources) return fail("no-databases");

    const owner = token.owner.type === "user" ? token.owner.user : null;
    const name = owner && "name" in owner ? (owner.name as string | null) : null;
    const email = owner && "person" in owner ? ((owner.person as { email?: string }).email ?? null) : null;
    await saveAccount({
      botId: token.bot_id,
      workspaceId: token.workspace_id,
      workspaceName: token.workspace_name,
      notionUserId: owner ? String(owner.id) : null,
      name,
      email,
      accessToken: token.access_token,
      dataSources,
    });

    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.set(SESSION_COOKIE, await createSession(token.bot_id), sessionCookieOptions());
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(DEMO_COOKIE);
    return res;
  } catch (err) {
    console.error(err);
    return fail("notion");
  }
}
