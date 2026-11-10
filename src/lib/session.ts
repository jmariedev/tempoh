import { cookies } from "next/headers";
import { db } from "./db";
import { decrypt, encrypt, randomToken, sha256 } from "./secrets";
import { DEFAULT_SETTINGS, type Settings } from "./types";

export const SESSION_COOKIE = "choreo_session";
export const DEMO_COOKIE = "choreo_demo";
export const STATE_COOKIE = "choreo_oauth_state";

export const SESSION_DAYS = 90;
const DAY_SECONDS = 60 * 60 * 24;

export const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeSeconds,
});

export const sessionCookieOptions = () => cookieOptions(SESSION_DAYS * DAY_SECONDS);

export interface DataSources {
  dances: string;
  dancers: string;
  choreographers: string;
  /** Combos and Classes came later, so older copies don't have them until combos are first used. */
  combos?: string;
  classes?: string;
}

export interface Account {
  botId: string;
  name: string | null;
  workspaceName: string | null;
  accessToken: string;
  dataSources: DataSources;
  settings: Settings;
  calendarUrl: string | null;
}

export interface NewAccount extends Omit<Account, "accessToken" | "settings" | "calendarUrl"> {
  accessToken: string;
  workspaceId: string;
  notionUserId: string | null;
  email: string | null;
}

/** Saves (or refreshes) someone's Notion connection after they sign in. */
export async function saveAccount(a: NewAccount) {
  const q = await db();
  await q`
    INSERT INTO users (bot_id, workspace_id, workspace_name, notion_user_id, name, email,
                       access_token, dances_ds, dancers_ds, choreographers_ds, combos_ds, classes_ds)
    VALUES (${a.botId}, ${a.workspaceId}, ${a.workspaceName}, ${a.notionUserId}, ${a.name}, ${a.email},
            ${encrypt(a.accessToken)}, ${a.dataSources.dances}, ${a.dataSources.dancers},
            ${a.dataSources.choreographers}, ${a.dataSources.combos ?? null}, ${a.dataSources.classes ?? null})
    ON CONFLICT (bot_id) DO UPDATE SET
      workspace_id = EXCLUDED.workspace_id,
      workspace_name = EXCLUDED.workspace_name,
      notion_user_id = EXCLUDED.notion_user_id,
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      access_token = EXCLUDED.access_token,
      dances_ds = EXCLUDED.dances_ds,
      dancers_ds = EXCLUDED.dancers_ds,
      choreographers_ds = EXCLUDED.choreographers_ds,
      combos_ds = COALESCE(EXCLUDED.combos_ds, users.combos_ds),
      classes_ds = COALESCE(EXCLUDED.classes_ds, users.classes_ds),
      updated_at = now()`;
}

/** Remembers where someone's Combos and Classes databases are, once found or made. */
export async function saveComboSources(botId: string, combos: string, classes: string) {
  const q = await db();
  await q`UPDATE users SET combos_ds = ${combos}, classes_ds = ${classes}, updated_at = now() WHERE bot_id = ${botId}`;
}

export async function saveCalendarUrl(botId: string, url: string | null) {
  const q = await db();
  await q`UPDATE users SET calendar_url = ${url ? encrypt(url) : null}, updated_at = now() WHERE bot_id = ${botId}`;
}

export async function saveSettings(botId: string, settings: Settings) {
  const q = await db();
  await q`UPDATE users SET settings = ${JSON.stringify(settings)}::jsonb, updated_at = now() WHERE bot_id = ${botId}`;
}

/** Starts a session and returns the token for the browser cookie. Only its hash is stored. */
export async function createSession(botId: string) {
  const q = await db();
  const token = randomToken();
  await q`
    INSERT INTO sessions (token_hash, bot_id, expires_at)
    VALUES (${sha256(token)}, ${botId}, now() + make_interval(days => ${SESSION_DAYS}))`;
  return token;
}

export async function endSession(token: string) {
  const q = await db();
  await q`DELETE FROM sessions WHERE token_hash = ${sha256(token)}`;
}

/** The signed-in person for this request, or null. */
export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const q = await db();
  const rows = (await q`
    SELECT u.bot_id, u.name, u.workspace_name, u.access_token,
           u.dances_ds, u.dancers_ds, u.choreographers_ds, u.combos_ds, u.classes_ds, u.settings, u.calendar_url
    FROM sessions s JOIN users u ON u.bot_id = s.bot_id
    WHERE s.token_hash = ${sha256(token)} AND s.expires_at > now()`) as Record<string, string | null>[];
  const row = rows[0];
  if (!row) return null;
  return {
    botId: row.bot_id!,
    name: row.name,
    workspaceName: row.workspace_name,
    accessToken: decrypt(row.access_token!),
    dataSources: {
      dances: row.dances_ds!,
      dancers: row.dancers_ds!,
      choreographers: row.choreographers_ds!,
      combos: row.combos_ds ?? undefined,
      classes: row.classes_ds ?? undefined,
    },
    settings: { ...DEFAULT_SETTINGS, ...((row.settings as unknown as Partial<Settings> | null) ?? {}) },
    calendarUrl: row.calendar_url ? decrypt(row.calendar_url) : null,
  };
}

export async function currentDemoId() {
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  return id && /^[A-Za-z0-9_-]{20,}$/.test(id) ? id : null;
}
