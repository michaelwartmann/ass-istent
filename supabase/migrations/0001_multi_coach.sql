-- 0001_multi_coach.sql
-- Adds multi-coach support: coaches table, coach_id on groups/players,
-- coach_exercises join table (global catalog + per-coach "space").
--
-- Paste into the Supabase SQL Editor (project: EU-Frankfurt) and run.
-- Idempotent — safe to re-run.

-- 1. Coaches ------------------------------------------------------------
create table if not exists coaches (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  password_hash text,
  reset_token text,
  reset_expires_at timestamptz,
  created_at timestamptz default now()
);

-- Pre-seed Michael (no password — set on first login)
insert into coaches (name) values ('Michael')
on conflict (name) do nothing;

-- 2. coach_id on groups / players --------------------------------------
alter table groups
  add column if not exists coach_id uuid references coaches(id) on delete cascade;

alter table players
  add column if not exists coach_id uuid references coaches(id) on delete cascade;

-- Backfill any pre-multi-coach rows to Michael
update groups
  set coach_id = (select id from coaches where name = 'Michael')
  where coach_id is null;

update players
  set coach_id = (select id from coaches where name = 'Michael')
  where coach_id is null;

-- Lock down to NOT NULL after backfill
alter table groups   alter column coach_id set not null;
alter table players  alter column coach_id set not null;

create index if not exists groups_coach_idx on groups(coach_id);
create index if not exists players_coach_idx on players(coach_id);

-- 3. coach_exercises (per-coach space, gartenapp-style) ----------------
-- started_at IS NULL  → "Samen" (saved for later)
-- started_at NOT NULL → "Im Einsatz" (in active rotation)
create table if not exists coach_exercises (
  coach_id uuid not null references coaches(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  started_at timestamptz,
  added_at timestamptz not null default now(),
  primary key (coach_id, exercise_id)
);

create index if not exists coach_exercises_coach_idx
  on coach_exercises(coach_id);

-- Backfill: every global exercise → Michael's space, started (in use)
insert into coach_exercises (coach_id, exercise_id, started_at)
select c.id, e.id, now()
from coaches c
cross join exercises e
where c.name = 'Michael'
on conflict do nothing;

-- 4. RLS for new tables ------------------------------------------------
alter table coaches enable row level security;
alter table coach_exercises enable row level security;

drop policy if exists "open all" on coaches;
drop policy if exists "open all" on coach_exercises;

create policy "open all" on coaches          for all using (true) with check (true);
create policy "open all" on coach_exercises  for all using (true) with check (true);
