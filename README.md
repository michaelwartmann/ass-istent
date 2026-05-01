# ass-istent

A coach's notebook for tennis training. Built for courtside use on a
phone — week view, day view, group rosters, evergreen learning goals,
dated session comments, dictation, and a season calendar.

Live at <https://ass-istent.vercel.app>.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind 4** + **shadcn/ui** (base-ui flavour — `render` prop, not
  Radix `asChild`)
- **Supabase** (EU-Frankfurt) — `@supabase/ssr` for the server client,
  `@supabase/supabase-js` (service role) for seed scripts
- **OpenRouter** → `google/gemini-2.0-flash-001` for audio transcription
  (Diktieren button)
- `date-fns` (de locale), `lucide-react`, `zod`, `sonner`,
  `class-variance-authority`

## What it does

### Multi-coach with name + password (no Supabase Auth)

Each trainer types their first name on `/login`. If the name exists
without a password, they set one (first login). If it exists with a
password, they sign in. If it doesn't exist, they create a new account.

Sessions are 1-year httpOnly cookies (`coach_auth`, `coach_name`,
`coach_id`). `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`)
gates every route except `/login`, `/forgot-password`, `/admin/reset/*`
and static assets.

Forgot-password generates a reset token; an admin (you) approves it via
`/admin/reset/[token]`. With no email provider configured the link is
just logged to the dev console — fine for a one-coach-per-club app.

Per-coach data isolation is enforced in **application code** (every
server action calls `requireCoachId()` and ownership-asserts before
mutating). RLS is enabled on every table but policies are
`open all` — the cookie session is the trust boundary. Tighten if/when
this moves to real Supabase Auth.

### Week view + day view

`/` lists this week's groups grouped by weekday with per-day dates
(`Mi 6.5.`) and prev/next-week chevrons (`?week=YYYY-MM-DD`). Days that
fall on a Feiertag / Schulferien / Sondertermin show a coloured badge
pulled from `calendar_days`.

`/day/[date]` is the courtside flow: tap a kid → bottom-sheet comment
dialog with the four dimension chips (Technik / Taktik / Athletik /
Mental) → write or dictate → save. The comment is dated to the
**training day** (`note_date` column), not the moment of writing.

### Groups, multi-membership

`/groups/[id]` shows the roster from a many-to-many `group_players`
table. The `+ Spieler` button opens a sheet that picks from the coach's
existing player database OR creates a new player. A kid can sit in
multiple groups (one record, one set of notes, multiple `group_players`
rows). `players.primary_group_id` is kept as the default-display group.

### Players

`/players/[id]`:

- 4 evergreen **Lernziele** cards (Technik / Taktik / Athletik / Mental)
  on top — short editable text per dimension, overwrite as the goal
  evolves.
- Dated coach comments below, grouped by `note_date desc`.
- Bearbeiten pencil → `/players/[id]/edit` (full form with Vorname,
  Nachname (optional), Jahrgang, Hand, Rückhand, Niveau, parent contact,
  description, the 4 Lernziele).

Privacy: **no photos of children**. Surnames stay nullable + hidden in
list views; only first names are surfaced.

### Exercises

Catalog is **global** across all coaches; each coach has a per-coach
**space** (`coach_exercises`) with two states: *Im Einsatz* (`started_at
not null`) and *Samen* (null). The plan editor only picks from the
coach's space; first time an exercise is used in a plan it auto-promotes
from Samen → Im Einsatz.

`/exercises/[id]` has a Bearbeiten pencil → full edit form.

### Plans

`/groups/[id]` shows this week's plan editor below the roster — a list
of typed blocks (warm-up / technical / physical / tactical / points /
cool-down), each with an exercise picker and duration. Plans are
auto-created per `(group, week_of)`; blocks can be moved up/down or
deleted.

### Calendar

`/calendar` renders Apr–Sep 2026 month grids with KW (Kalenderwoche)
column. Cells are coloured from `calendar_days` (Feiertag, Schulferien,
Sondertermin). Training-day cells are clickable → `/day/[date]`.

The data is seeded once from `scripts/seed-calendar.ts` (NRW Feiertage,
Sommerferien NRW, plus the user's hand-noted Sondertermine: Jugendcamp
19.–22.07, Sparkasse Cup 28.–30.08, Top10 LK-Tagesturnier 27.09).

### Dictation (Diktieren)

Both the player-notes FAB and the day-view comment dialog have a
Diktieren button.

- Browser uses `MediaRecorder` to record in **5-second chunks**
  (stop+restart so each chunk is a self-contained webm/mp4 file).
- Each chunk → `POST /api/transcribe` (multipart) → server base64-encodes
  → OpenRouter `/chat/completions` with `google/gemini-2.0-flash-001`,
  audio sent as an `input_audio` content block, prompt asks for
  verbatim German transcription.
- Returned text appended to the textarea with a smart separator.
- Words appear ~5 s after they're spoken; "wird transkribiert…"
  indicator shows while a chunk is in flight.

Cost: ~$0.0002/min audio. Backed by OpenRouter credits.

### PWA

Installable on iOS and Android — terracotta theme, standalone display,
512 × 512 maskable icon. Manifest at `/public/manifest.webmanifest`.

## Data model

```
coaches ──< groups        (groups.coach_id)
        ──< players       (players.coach_id)
        ──< coach_exercises ─── exercises  [global catalog]
        ──< calendar_days

groups   ──< group_players >── players      [many-to-many]
         ──< training_plans  (one per ISO week)
training_plans ──< plan_blocks (5–10 typed blocks)

players  ──< player_notes  (dated 4-dim comments)
players   .  goal_technical / goal_tactical / goal_physical / goal_mental
             (evergreen Lernziele as columns on the player row)
```

Migrations live under `supabase/migrations/`:

- `0001_multi_coach.sql` — coaches, coach_id columns, coach_exercises
- `0002_roster_calendar.sql` — group_players, calendar_days, the four
  Lernziel columns, `note_date` on player_notes, backhand /
  description on players

`supabase/schema.sql` is the consolidated current schema.

## First-time setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable                            | Where                              |
| ----------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | same                               |
| `SUPABASE_SERVICE_ROLE_KEY`         | same (only for seed scripts)       |
| `OPENROUTER_API_KEY`                | <https://openrouter.ai> → Keys     |

Apply the schema:

1. Open Supabase SQL Editor
2. Paste `supabase/migrations/0001_multi_coach.sql` and run
3. Paste `supabase/migrations/0002_roster_calendar.sql` and run

Seed Michael's coach + groups + the global exercise catalog:

```bash
npx tsx scripts/seed.ts
```

Seed the actual roster (41 kids across the Mi/Do groups):

```bash
npx tsx scripts/seed-roster.ts
```

Seed the 2026 season calendar (NRW Feiertage, Sommerferien,
Sondertermine):

```bash
npx tsx scripts/seed-calendar.ts
```

All three seeds are idempotent — re-running is safe.

## Develop

```bash
npm run dev
```

Resize the browser to ~390 px (iPhone) or use device mode. Dev port
defaults to 3000 — pass `PORT=3001 npm run dev` if it's busy.

Useful checks:

```bash
npm run build          # full TypeScript + route generation
npx eslint .           # lint
```

## Routes

| Path                       | What                                                                |
| -------------------------- | ------------------------------------------------------------------- |
| `/`                        | Diese Woche — groups by weekday, prev/next-week, calendar badges    |
| `/calendar`                | Apr–Sep 2026 month grids, clickable training days                   |
| `/day/[date]`              | Day view — groups + rosters, tap a kid → comment dialog             |
| `/groups/[id]`             | Group detail, roster (multi-group), this week's plan editor         |
| `/groups/[id]/edit`        | Edit / delete a group                                               |
| `/groups/new`              | Create a group                                                      |
| `/players`                 | All players (first names only)                                      |
| `/players/[id]`            | Profile + 4 Lernziele + dated comments                              |
| `/players/[id]/edit`       | Edit a player                                                       |
| `/players/new`             | Create a player                                                     |
| `/exercises`               | Mein Bestand / Katalog tabs                                         |
| `/exercises/[id]`          | Exercise detail + Bearbeiten                                        |
| `/exercises/[id]/edit`     | Edit an exercise (global catalog)                                   |
| `/exercises/new`           | Create a new exercise                                               |
| `/settings`                | Coach name + Abmelden                                               |
| `/login`                   | Name → password / setup / signup                                    |
| `/forgot-password`         | Request a password reset                                            |
| `/admin/reset/[token]`     | Manual admin reset confirmation                                     |
| `/api/transcribe`          | POST audio chunk → returns `{ text }` (server-side, OpenRouter)     |

## Branding

Logos live in `/public/`:

- `tub-bocholt-sportverein.png` — header left
- `kalisch.png` — header right
- `apple-touch-icon.png` / `icon-192.png` / `icon-512.png` — PWA icons

If a club logo is missing, the slot falls back to a coloured initial
chip.

## Privacy

The app stores rosters of minors. The `/public` folder gitignores
`*.jpeg`, `*.jpg`, `*.heic`, `*.webp`, `*.xlsx`, `*.pdf` so coach
worksheets and roster cards never end up in git. The schema **never**
stores child photos. Last names are nullable and hidden in list views by
default; only first names are surfaced. Parent contacts are surfaced
only on the player edit page.

## Deployment

Vercel-native; pushing to `main` triggers a build. Add the same
environment variables (Production + Preview) in
Vercel → Settings → Environment Variables.

The PWA manifest, icons, and `theme_color` (`#c66747`, terracotta) are
set up so installing to the iOS / Android home screen renders the app
in standalone mode without browser chrome.
