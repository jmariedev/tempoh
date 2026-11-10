import { Client, isFullDataSource, isFullPage } from "@notionhq/client";
import type { DataSources } from "./session";

// Sign in with Notion (OAuth for a public Notion integration).

export function appUrl(request: Request) {
  return (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

export const redirectUri = (request: Request) => `${appUrl(request)}/api/auth/callback`;

function clientCredentials() {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Notion sign-in isn't set up yet");
  return { clientId, clientSecret };
}

export function authorizeUrl(request: Request, state: string) {
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", clientCredentials().clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirectUri(request));
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCode(request: Request, code: string) {
  const { clientId, clientSecret } = clientCredentials();
  return new Client().oauth.token({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(request),
  });
}

const NAMES = {
  dances: "Dances",
  dancers: "Dancers",
  choreographers: "Choreographers",
  combos: "Combos",
  classes: "Classes",
} as const;
const KINDS = Object.keys(NAMES) as (keyof DataSources)[];
const kindOf = (title: string) => KINDS.find((k) => NAMES[k] === title.trim());

/** Reads the three databases straight off a page's blocks, which works before search has caught up. */
async function fromPage(notion: Client, pageId: string): Promise<DataSources | null> {
  const found: Partial<DataSources> = {};
  let cursor: string | undefined;
  do {
    const page = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    for (const block of page.results) {
      if (!("type" in block) || block.type !== "child_database") continue;
      const kind = kindOf(block.child_database.title);
      if (!kind || found[kind]) continue;
      const db = await notion.databases.retrieve({ database_id: block.id });
      const source = "data_sources" in db ? db.data_sources[0] : undefined;
      if (source) found[kind] = source.id;
    }
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);
  // Combos and Classes are optional: older copies of the template don't have them.
  return found.dances && found.dancers && found.choreographers ? (found as DataSources) : null;
}

/**
 * Finds the Dances, Dancers and Choreographers databases this person shared with the app.
 * They can come from the template Notion copied during sign-in, or from an existing
 * tempoh page they picked. All three must sit on the same page.
 */
export async function findDataSources(accessToken: string, templatePageId: string | null): Promise<DataSources | null> {
  const notion = new Client({ auth: accessToken });
  // They chose to copy the template, so only that copy counts. Notion may still be copying it,
  // in which case this returns null and the caller tries again.
  if (templatePageId) return fromPage(notion, templatePageId).catch(() => null);

  const results = [];
  let cursor: string | undefined;
  do {
    const page = await notion.search({ start_cursor: cursor, page_size: 100 });
    results.push(...page.results);
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);

  // Group the matching databases by the page they live on.
  const byPage = new Map<string, Partial<DataSources> & { edited: string }>();
  const pages: { id: string; edited: string }[] = [];
  for (const r of results) {
    if (r.object === "page" && isFullPage(r) && !r.in_trash) pages.push({ id: r.id, edited: r.last_edited_time });
    if (r.object !== "data_source" || !isFullDataSource(r) || r.in_trash) continue;
    const kind = kindOf(r.title.map((t) => t.plain_text).join(""));
    if (!kind || r.database_parent.type !== "page_id") continue;
    const pageId = r.database_parent.page_id;
    const group = byPage.get(pageId) ?? { edited: "" };
    group[kind] = r.id;
    if (r.last_edited_time > group.edited) group.edited = r.last_edited_time;
    byPage.set(pageId, group);
  }
  console.log(`Sign-in search found ${pages.length} pages and ${byPage.size} pages with tempoh databases`);

  const complete = [...byPage.entries()].filter(([, g]) => g.dances && g.dancers && g.choreographers);
  // Use the most recently edited set.
  const best = complete.sort((a, b) => b[1].edited.localeCompare(a[1].edited))[0];
  if (best) {
    const g = best[1];
    return { dances: g.dances!, dancers: g.dancers!, choreographers: g.choreographers!, combos: g.combos, classes: g.classes };
  }

  // Search can lag behind for databases, so look inside the shared pages themselves.
  for (const page of pages.sort((a, b) => b.edited.localeCompare(a.edited)).slice(0, 10)) {
    const found = await fromPage(notion, page.id).catch(() => null);
    if (found) return found;
  }
  return null;
}
