# ass-istent

Coach's notebook for tennis training: groups, players, exercises, weekly plans.

Mobile-first Next.js 16 + Tailwind 4 + Supabase (EU-Frankfurt).

## Stack

- **Next.js 16 (App Router, Turbopack), React 19, TypeScript**
- **Tailwind 4** + **shadcn/ui** (base-ui flavour, neutral)
- **Supabase** for DB; `@supabase/ssr` for server clients
- `date-fns`, `lucide-react`, `zod`, `react-hook-form`, `sonner`
- Web Speech API for voice-dictated player notes (`de-DE`)

## First-time setup

```bash
npm install
cp .env.local.example .env.local        # values may already match your project
```

Then in the Supabase SQL Editor, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql) and run it.

Seed example data (10 groups + ~22 exercises):

```bash
npx tsx scripts/seed.ts
```

The seed script is idempotent — it will update by name on re-runs.

## Develop

```bash
npm run dev
```

The app is mobile-first; resize your browser to ~390px or use device mode.

## Routes

| Path                 | What                                             |
| -------------------- | ------------------------------------------------ |
| `/`                  | Week view — all groups grouped by weekday        |
| `/groups/[id]`       | Group detail, players, current week's plan       |
| `/players`           | All players                                      |
| `/players/new`       | Add a new player                                 |
| `/players/[id]`      | Profile + notes (4 categories, voice dictation)  |
| `/exercises`         | Exercise library, search & filter                |
| `/exercises/[id]`    | Exercise detail                                  |
| `/exercises/new`     | Add a new exercise                               |
| `/settings`          | Placeholder                                      |

## Branding

Drop these PNGs into `/public` (header falls back to text otherwise):

- `logo-tub.png` — TuB Bocholt
- `logo-mike.png` — coach
- `logo-kalisch.png` — Kalisch

## Auth

v1 = single coach. RLS is enabled with open `anon` policies; tighten in
`supabase/schema.sql` when a second coach joins.
