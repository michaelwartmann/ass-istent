-- 0003_attendance.sql
-- Adds per-lesson attendance tracking and session metadata.
--
-- lesson_sessions = one row per (group, date) the lesson actually happened
-- (or was scheduled and then cancelled). Attendance attaches to the session
-- row so per-lesson notes / cancellation / weather can be added later.
--
-- attendance = one row per (session, player) with three states.
-- Default = unmarked = no row.
--
-- Paste into the Supabase SQL Editor (project: EU-Frankfurt) and run.
-- Idempotent — safe to re-run.

-- 1. lesson_sessions ----------------------------------------------------
create table if not exists lesson_sessions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  session_date date not null,
  cancelled boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (group_id, session_date)
);

create index if not exists lesson_sessions_group_date_idx
  on lesson_sessions(group_id, session_date desc);

-- 2. attendance ---------------------------------------------------------
create table if not exists attendance (
  session_id uuid not null references lesson_sessions(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  status text not null check (status in ('present','absent','excused')),
  recorded_at timestamptz not null default now(),
  primary key (session_id, player_id)
);

create index if not exists attendance_player_idx on attendance(player_id);

-- 3. RLS ---------------------------------------------------------------
alter table lesson_sessions enable row level security;
alter table attendance       enable row level security;

drop policy if exists "open all" on lesson_sessions;
drop policy if exists "open all" on attendance;

create policy "open all" on lesson_sessions for all using (true) with check (true);
create policy "open all" on attendance      for all using (true) with check (true);
