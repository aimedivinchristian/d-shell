# D>shell

Learn Linux by using it. A real, in-browser shell — virtual filesystem, real
command behavior, zero backend — with optional hands-on challenges.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- No database, no auth, no API routes — fully static
- Progress (challenge completion) persists in `localStorage`

No environment variables are required. Optionally set `NEXT_PUBLIC_SITE_URL`
(e.g. `https://d-shell.yourdomain.com`) so social share previews resolve
image URLs correctly — on Vercel this is inferred automatically from
`VERCEL_URL` if unset.

## Cross-device sync (optional)

D>shell works fully anonymously with no setup — progress is saved to
`localStorage` and stays on that browser. To enable sign-in and cross-device
sync of both challenge progress and the sandbox filesystem:

1. Create a Supabase project at https://supabase.com.
2. In the SQL editor, run `supabase/schema.sql` from this repo. This creates
   the `progress` and `sessions` tables with row-level security so each user
   can only read/write their own rows.
3. Set two env vars (locally in `.env.local`, and in your Vercel project
   settings for production):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   Both values are in Supabase → Project Settings → API. The anon key is
   safe to expose client-side — that's what it's for; RLS is what actually
   protects the data.
4. **Magic link** works with zero further setup — Supabase's default email
   provider handles it, though for production you'll want to configure a
   custom SMTP sender in Supabase → Auth → Email Templates so links don't
   land in spam.
5. **GitHub OAuth** needs a GitHub OAuth App:
   - GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: your deployed site URL
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
     (get the exact value from Supabase → Auth → Providers → GitHub)
   - Copy the generated Client ID and Client Secret into Supabase → Auth →
     Providers → GitHub, and toggle it on.

If these env vars aren't set, the sign-in button still renders but shows
"Sync isn't configured for this deployment" instead of erroring — the app
never assumes Supabase is available.

**Common gotcha:** Supabase rejects magic-link and OAuth redirects to URLs
that aren't allowlisted. Add both your local (`http://localhost:3000`) and
production URLs under Supabase → Auth → URL Configuration → Redirect URLs,
or sign-in will silently fail to redirect back to the app after the user
clicks the email link or authorizes on GitHub.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (Vercel — recommended)

1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. No environment variables or build settings needed — Vercel auto-detects
   Next.js. Click Deploy.

Alternatively, from the CLI:

```bash
npm i -g vercel
vercel
```

## Deploy (any Node host)

```bash
npm install
npm run build
npm run start
```

Serves on port 3000 by default (override with `PORT=xxxx npm run start`).

## Project structure

```
app/                 routes, layout, metadata, icons, error/404 pages
components/           Terminal, ChallengeGrid, theme toggle, header
lib/shell/            the shell engine — virtual filesystem + command interpreter
lib/challenges.ts     challenge definitions + completion verifiers
lib/progress.ts        storage adapter for saved progress (localStorage today)
hooks/use-progress.ts  React hook wrapping the progress adapter
```

## Adding a shell command

Add a handler to the `handlers` object in `lib/shell/commands.ts`. Each
handler receives `(args, state)` and returns `{ output, error?, clear? }`.

## Adding a challenge

Add an entry to the `challenges` array in `lib/challenges.ts` with a
`verify(state)` function that checks either the filesystem
(`getNode(state.root, [...path])`) or command history
(`state.history.some(...)`). Completion is monotonic — once a challenge's
`verify` returns true, it stays marked complete even if later actions would
no longer satisfy it.

## Known scope for v1

- Anonymous users: only challenge *completion* persists locally — the
  filesystem/history reset on reload.
- Signed-in users (with Supabase configured): both progress and the full
  sandbox filesystem sync across devices. Filesystem syncs are debounced
  (4s after the last command) rather than pushed on every keystroke.
- No offline queueing — if a sync push fails (network blip), it's silently
  dropped rather than retried. Acceptable for a learning tool; would need
  a retry/queue layer for anything higher-stakes.
