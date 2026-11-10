@AGENTS.md

# tempoh

A choreography tracker for dance teachers (the folder and README still say "Choreo HQ"; the product name is tempoh). It keeps each dance's dancers, progress, song, notes, costumes and performance date together, and tracks solo contracts (sent/signed) and payments (unpaid/partial/paid). Notion is the database.

Live: https://tempohapp.vercel.app

## Stack
Next.js (App Router, see the AGENTS.md note: this Next version differs from older docs, read `node_modules/next/dist/docs/` before changing framework code), React, TypeScript. Notion API (`@notionhq/client`) as the data store, Neon Postgres for sign-in sessions, Vercel Blob, TipTap for rich notes, Tabler icons, ical.js for the calendar.

## Commands
```bash
npm run dev      # runs on http://localhost:3457
npm run build
npm run lint
```
With an empty `.env.local`, only the demo works.

## How it works
- Sign in with Notion (public integration). Signing in copies the tempoh template (Dances, Dancers, Choreographers databases) into the user's workspace.
- Postgres stores the Notion connection (token encrypted with AES-256-GCM using `TOKEN_ENCRYPTION_KEY`) and hashed session tokens. Tables are created on first connect.
- "Try the demo" gives each visitor private sample data in server memory (`src/app/api/demo`).
- API routes are in `src/app/api/` (dances, dancers, choreographers, classes, combos, songs, calendar, auth).

## Rules
- The app reads and writes Notion properties by name. Don't rename properties in the Dances / Dancers / Choreographers databases without updating the code (list is in the README).
- Song uploads go to Notion file storage: 5 MB limit on free workspaces, 20 MB on paid.
- Never log or return Notion access tokens; keep secrets in `.env.local`.

## Look and feel
Quiet, monochrome, rounded.
- Font: Plus Jakarta Sans (400-800)
- Colors (in `src/app/globals.css`): frame `#e9e9ec`, panel `#f6f6f7`, tiles `#ffffff`, ink `#18181b`, muted `#6b6b73`, danger `#b4233c`
- Radius 28px, soft lift shadow
- Logo: the "turn" mark (open circle, center dot, small dot) in white on a black circle (`src/components/LogoMark.tsx`, `src/app/icon1.svg`)

## Working here
- Deploy: `cd ~/choreo-hq && vercel deploy --prod`. Always run it from this folder; running it from `~` tries to upload the whole home folder. Ask before each production deploy.
- No git, on purpose. Don't run `git init`, commit, or offer to commit.
- https://choreo-hq.vercel.app forwards to the same path on tempohapp with a 308 (`src/proxy.ts`). `APP_URL` is set to the tempohapp address.
- Notion pages: "Tempoh" holds the live data, and "Tempoh template" is the empty master that Notion copies on sign-in. Keep both.
- Combos and Classes databases are found or created on first use; their IDs are stored in Neon (`combos_ds`, `classes_ds`). Read their properties by name too.
- Songs upload to a private Vercel Blob store ("choreo-hq-songs") and play through hour-long presigned links.
- Copy and UI rules: no em dashes, no emojis, no eyebrow labels above titles, no gradients. Color is only for stages. Use icons instead of emoji.

## Updates and to-dos (Notion)
Ideas, bugs and changes for tempoh are tracked in Jackie's "app updates" Notion database:
https://app.notion.com/p/d25a73a0c1bb47f28b57919e217c066a (data source `collection://a240fba4-441f-4f7e-9ec7-86e38c22651d`).
Each row links to its app through the `project` relation. This app's project page is https://app.notion.com/p/d5b7b64e63844395a14102439e992ed2.
Fields: `name`, `type` (idea, bug, update, polish), `status` (inbox, next, in progress, done), `priority` (high, medium, low), `notes`, `done on`.

- Before starting work, check this app's open items (status inbox, next or in progress) and mention any that relate to the task.
- When Jackie asks what's next, answer from this list: `next` first, then by priority.
- When you start an item, set its status to `in progress`. When it ships, set status `done`, set `done on` to today, and add a one-line note of what changed.
- If you notice a bug or idea outside the current task, add it as a new row (status `inbox`, the right `type`, linked to this project) instead of fixing it unasked.
- If the Notion tools aren't available, list the changes at the end of your reply so Jackie can update the database.

## Keep Notion in sync
This file is mirrored in the "claude context" toggle at the bottom of the tempoh page in Jackie's Notion projects database:
https://app.notion.com/p/d5b7b64e63844395a14102439e992ed2

Whenever you change this file, or change anything it describes (stack, commands, folder layout, rules, colors, fonts, logo), also:
1. Update this file so it stays accurate.
2. Update the "claude context" toggle on the Notion page to match. Use the Notion tools if they're connected; edit only that toggle and leave the rest of the page (description, to-do lists, cover, icon) alone.
3. If the project's status, live URL, tech stack or one-line notes changed, update those properties on the same Notion page too.

If the Notion tools aren't available, say so at the end of your reply and list what needs updating, so Jackie can do it.
