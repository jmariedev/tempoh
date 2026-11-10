# tempoh

A choreography tracker for dance teachers. It keeps every dance's dancers, progress, song, notes, and performance date in one place, with Notion as the database.

- Dances show their type (solo, duo, trio, group) from how many dancers are in them, plus the dancers' average age.
- Solos also track the contract (sent, signed) and payment (unpaid, partial paid, paid).
- Each dance can have an mp3 that plays in the app, with a large, easy-to-drag timeline.
- Filter by progress: scheduled, in choreography, cleaning, done, waiting. Switch between cards and a list.
- Dancers have a birthdate, and the app works out their age.

## How it works

- **Sign in with Notion.** Choreo HQ is a public Notion integration. Signing in copies an empty Choreo HQ template (Dances, Dancers and Choreographers databases) into your workspace, or you can share an existing Choreo HQ page instead. Your dances stay in your own Notion.
- **Postgres keeps you signed in.** It stores your Notion connection (the access token is encrypted with AES-256-GCM) and your sessions (only a hash of each session token is stored). Tables are created automatically the first time the app connects.
- **Try the demo** gives each visitor a private copy of sample data that lives in the server's memory, so no account is needed.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no settings filled in, only the demo works. Fill in `.env.example`'s values to try Sign in with Notion locally (register `http://localhost:3457/api/auth/callback` as a redirect URI too).

## Set up Sign in with Notion

1. At https://www.notion.so/profile/integrations, create a **Public** integration.
2. Add the redirect URI `https://YOUR-SITE/api/auth/callback`.
3. Set the template to the published **Choreo HQ template** page.
4. Add the privacy policy (`/privacy`) and terms (`/terms`) links.
5. Copy the OAuth client ID and secret into `NOTION_OAUTH_CLIENT_ID` and `NOTION_OAUTH_CLIENT_SECRET`.

## Notion databases

| Database | Properties |
| --- | --- |
| Dances | Name, Choreographer, Dancers, Progress, Song, Notes, Due Date, Contract, Payment, Type (formula), Avg Age (rollup) |
| Dancers | Name, Birthdate, Age (formula), Dances |
| Choreographers | Name, Dances |

Keep these property names as they are. The app reads and writes them by name.

## Songs

Songs upload to Notion's file storage. Free Notion workspaces allow files up to 5 MB; paid workspaces allow up to 20 MB through this app. Notion's file links expire after an hour, so the player fetches a fresh link each time it opens.
