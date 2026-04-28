-- ass-istent schema
-- Paste into the Supabase SQL editor (project: EU-Frankfurt).
-- Multi-coach app: each coach signs up with a name + password and only sees
-- their own groups, players, and exercise space. The exercise catalog is
-- global; coach_exercises is the per-coach "space" (started = in use).
-- RLS is enabled but policies are open — filtering is done in app code.

create extension if not exists "uuid-ossp";

-- Coaches ----------------------------------------------------------
create table if not exists coaches (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  password_hash text,
  reset_token text,
  reset_expires_at timestamptz,
  created_at timestamptz default now()
);

-- Groups -----------------------------------------------------------
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references coaches(id) on delete cascade,
  name text not null,
  day_of_week int not null,           -- 1=Mon ... 7=Sun
  start_time time not null,
  end_time time not null,
  location text not null,             -- 'Tennisschule' | 'TuB Bocholt' | 'VHS'
  ball_type text,                     -- 'green' | 'orange' | 'red' | 'hard' | null
  level text,
  age_band text,
  active_from date,
  active_until date,
  notes text,
  created_at timestamptz default now()
);

create index if not exists groups_coach_idx on groups(coach_id);

-- Players ----------------------------------------------------------
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references coaches(id) on delete cascade,
  first_name text not null,
  last_name text,
  year_of_birth int,
  primary_group_id uuid references groups(id) on delete set null,
  dominant_hand text,                 -- 'right' | 'left'
  level text,
  parent_contact text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists players_primary_group_idx on players(primary_group_id);
create index if not exists players_coach_idx on players(coach_id);

-- Player notes -----------------------------------------------------
create table if not exists player_notes (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  category text not null check (category in ('technical','tactical','physical','mental')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists player_notes_player_idx on player_notes(player_id, created_at desc);

-- Exercises (global catalog — shared across all coaches) -----------
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,                   -- markdown
  category text not null check (category in ('warm_up','technical','tactical','physical','points','cool_down')),
  ball_type text,
  level text,
  group_size_min int,
  group_size_max int,
  duration_minutes int,
  equipment text,
  tags text[],
  created_at timestamptz default now()
);

create index if not exists exercises_category_idx on exercises(category);

-- Coach exercise space (per-coach selection from global catalog) ---
-- started_at IS NULL  → "Samen" (saved for later)
-- started_at NOT NULL → "Im Einsatz" (in active rotation)
create table if not exists coach_exercises (
  coach_id uuid not null references coaches(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  started_at timestamptz,
  added_at timestamptz not null default now(),
  primary key (coach_id, exercise_id)
);

create index if not exists coach_exercises_coach_idx on coach_exercises(coach_id);

-- Training plans ---------------------------------------------------
create table if not exists training_plans (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  week_of date not null,
  notes text,
  created_at timestamptz default now(),
  unique (group_id, week_of)
);

-- Plan blocks ------------------------------------------------------
create table if not exists plan_blocks (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references training_plans(id) on delete cascade,
  order_index int not null,
  block_type text not null check (block_type in ('warm_up','technical','physical','tactical','points','cool_down')),
  exercise_id uuid references exercises(id) on delete set null,
  duration_minutes int,
  notes text
);

create index if not exists plan_blocks_plan_idx on plan_blocks(plan_id, order_index);

-- RLS --------------------------------------------------------------
-- Open policies — filtering is done in application code via current
-- coach cookie. Tighten if/when Supabase Auth replaces the cookie session.
alter table coaches enable row level security;
alter table groups enable row level security;
alter table players enable row level security;
alter table player_notes enable row level security;
alter table exercises enable row level security;
alter table coach_exercises enable row level security;
alter table training_plans enable row level security;
alter table plan_blocks enable row level security;

drop policy if exists "open all" on coaches;
drop policy if exists "open all" on groups;
drop policy if exists "open all" on players;
drop policy if exists "open all" on player_notes;
drop policy if exists "open all" on exercises;
drop policy if exists "open all" on coach_exercises;
drop policy if exists "open all" on training_plans;
drop policy if exists "open all" on plan_blocks;

create policy "open all" on coaches          for all using (true) with check (true);
create policy "open all" on groups           for all using (true) with check (true);
create policy "open all" on players          for all using (true) with check (true);
create policy "open all" on player_notes     for all using (true) with check (true);
create policy "open all" on exercises        for all using (true) with check (true);
create policy "open all" on coach_exercises  for all using (true) with check (true);
create policy "open all" on training_plans   for all using (true) with check (true);
create policy "open all" on plan_blocks      for all using (true) with check (true);
