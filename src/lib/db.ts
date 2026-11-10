import { neon } from "@neondatabase/serverless";

// Postgres (Neon) holds who is signed in: each person's Notion connection and their sessions.
// Dance data itself always stays in that person's Notion.

let client: ReturnType<typeof neon> | null = null;
let ready: Promise<void> | null = null;

function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL isn't set");
  client ??= neon(process.env.DATABASE_URL);
  return client;
}

/** Creates the tables the first time the app talks to the database. */
export async function db() {
  const q = sql();
  ready ??= (async () => {
    await q`
      CREATE TABLE IF NOT EXISTS users (
        bot_id text PRIMARY KEY,
        workspace_id text NOT NULL,
        workspace_name text,
        notion_user_id text,
        name text,
        email text,
        access_token text NOT NULL,
        dances_ds text,
        dancers_ds text,
        choreographers_ds text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
    // Added with combos: where each person's Combos and Classes live, and which sections they use.
    await q`ALTER TABLE users ADD COLUMN IF NOT EXISTS combos_ds text`;
    await q`ALTER TABLE users ADD COLUMN IF NOT EXISTS classes_ds text`;
    await q`ALTER TABLE users ADD COLUMN IF NOT EXISTS settings jsonb`;
    // A calendar's private iCal link, encrypted like the Notion token.
    await q`ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_url text`;
    await q`
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash text PRIMARY KEY,
        bot_id text NOT NULL REFERENCES users(bot_id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  await ready;
  return q;
}
