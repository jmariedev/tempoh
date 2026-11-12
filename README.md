# tempoh

A choreography tracker for dance teachers. It keeps every dance's dancers, stage, song, costume, notes and performance date together, plus the quick combos you teach in class. Your own Notion is the database.

Live at https://tempohapp.vercel.app. There's a step by step guide at [/guide](https://tempohapp.vercel.app/guide).

## What it does

- **Home.** A greeting, cards for Dances and Combos, Quick add, and this week from your calendar with tempoh due dates alongside.
- **Dances.** Each dance shows its type (solo, duo, trio, group) from how many dancers are in it, the dancers' ages, and a stage: scheduled, in choreography, cleaning, done or waiting. Filter by stage and type, and switch between cards and a list. Solos also track the contract (sent, signed) and payment (unpaid, partial paid, paid).
- **Dancers and choreographers.** Dancers have a birthdate, so their age stays current, or an age set by hand.
- **Songs.** Drag an MP3 or M4A onto a dance or combo. The player has a large timeline and 5 second skips.
- **Combos and classes.** Quick class combos with a name, date, class, optional song and notes. Removing one has an undo. Classes are managed on their own tab.
- **Calendar.** Paste a Google, Apple or Outlook calendar's private iCal link in Settings, and its events show on Home. It's view only.
- **Settings.** Turn Dances or Combos off if you don't use them. Nothing is deleted.

## How it works

- **Sign in with Notion.** tempoh is a public Notion integration. Signing in copies the empty tempoh template into your workspace, or you can share an existing tempoh page. Your data stays in your own Notion.
- **Postgres (Neon) keeps you signed in.** It stores your Notion connection, which databases are yours, your settings and your calendar link. The Notion token and calendar link are encrypted with AES-256-GCM, and only a hash of each session token is stored. Tables and columns are created the first time the app connects.
- **Songs** upload straight from the browser to a private Vercel Blob store. Notion keeps a link to each song, and the player gets a fresh link that lasts an hour.
- **The demo** gives each visitor a private copy of sample data in the server's memory, so no account is needed.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no settings filled in, only the demo works. To try Sign in with Notion locally, fill in `.env.local` and add your local callback (for example `http://localhost:3457/api/auth/callback`) as a redirect URI on the integration.

| Setting | What it's for |
| --- | --- |
| `NOTION_OAUTH_CLIENT_ID`, `NOTION_OAUTH_CLIENT_SECRET` | The public Notion integration |
| `APP_URL` | The site's address, used for the sign-in redirect and share previews |
| `DATABASE_URL` | Neon Postgres |
| `TOKEN_ENCRYPTION_KEY` | Encrypts Notion tokens and calendar links |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob, for song uploads |

## Set up Sign in with Notion

1. At https://www.notion.so/profile/integrations, create a **Public** integration.
2. Add the redirect URI `https://YOUR-SITE/api/auth/callback`.
3. Set the template to the published **tempoh template** page.
4. Add the privacy policy (`/privacy`) and terms (`/terms`) links.
5. Copy the OAuth client ID and secret into the settings above.

## Notion databases

| Database | Properties |
| --- | --- |
| Dances | Name, Choreographer, Dancers, Progress, Song, Song Title, Notes, Costume, Due Date, Contract, Contract Date, Payment, Amount Paid, Payment Method, Type (formula), Avg Age (rollup) |
| Dancers | Name, Birthdate, Set Age, Age (formula), Dances |
| Choreographers | Name, Dances |
| Combos | Name, Date, Class, Song Title, Notes, Song |
| Classes | Name |

The app reads and writes these by name, so keep the database and property names as they are. Older tempoh pages without Combos and Classes get them added the first time Combos is used.
