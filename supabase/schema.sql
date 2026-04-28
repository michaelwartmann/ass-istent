-- ass-istent schema
-- Paste into the Supabase SQL editor (project: EU-Frankfurt).
-- Single-coach app for v1; RLS enabled but policies are open for now.

create extension if not exists "uuid-ossp";

-- Groups -----------------------------------------------------------
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
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

-- Players ----------------------------------------------------------
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
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

-- Player notes -----------------------------------------------------
create table if not exists player_notes (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  category text not null check (category in ('technical','tactical','physical','mental')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists player_notes_player_idx on player_notes(player_id, created_at desc);

-- Exercises --------------------------------------------------------
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
-- Single-user app for now: enable RLS but allow anon read+write.
-- Tighten when auth is added.
alter table groups enable row level security;
alter table players enable row level security;
alter table player_notes enable row level security;
alter table exercises enable row level security;
alter table training_plans enable row level security;
alter table plan_blocks enable row level security;

drop policy if exists "open all" on groups;
drop policy if exists "open all" on players;
drop policy if exists "open all" on player_notes;
drop policy if exists "open all" on exercises;
drop policy if exists "open all" on training_plans;
drop policy if exists "open all" on plan_blocks;

create policy "open all" on groups          for all using (true) with check (true);
create policy "open all" on players         for all using (true) with check (true);
create policy "open all" on player_notes    for all using (true) with check (true);
create policy "open all" on exercises       for all using (true) with check (true);
create policy "open all" on training_plans  for all using (true) with check (true);
create policy "open all" on plan_blocks     for all using (true) with check (true);
