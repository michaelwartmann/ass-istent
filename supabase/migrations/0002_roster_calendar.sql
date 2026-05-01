-- 0002_roster_calendar.sql
-- v2 schema additions: multi-group per player, evergreen Lernziele,
-- dated coach comments, per-coach calendar.
--
-- Paste into the Supabase SQL Editor (project: EU-Frankfurt) and run.
-- Idempotent — safe to re-run.

-- 1. Player additions: Rückhand, Beschreibung, 4 evergreen Lernziele -----
alter table players
  add column if not exists backhand text,
  add column if not exists description text,
  add column if not exists goal_technical text,
  add column if not exists goal_tactical text,
  add column if not exists goal_physical text,
  add column if not exists goal_mental text;

-- Validate backhand values when present (allow null = unbekannt).
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'players' and constraint_name = 'players_backhand_check'
  ) then
    alter table players
      add constraint players_backhand_check
      check (backhand in ('einhaendig', 'beidhaendig'));
  end if;
end $$;

-- 2. Dated coach comments: note_date column on player_notes ------------
alter table player_notes
  add column if not exists note_date date;

-- Backfill note_date for any pre-existing notes (none yet, but safe).
update player_notes
  set note_date = (created_at at time zone 'Europe/Berlin')::date
  where note_date is null;

create index if not exists player_notes_player_date_idx
  on player_notes(player_id, note_date desc);

-- 3. Multi-group join: group_players ----------------------------------
create table if not exists group_players (
  group_id uuid not null references groups(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

create index if not exists group_players_group_idx on group_players(group_id);
create index if not exists group_players_player_idx on group_players(player_id);

-- Backfill: copy any existing players.primary_group_id into group_players.
insert into group_players (group_id, player_id)
select primary_group_id, id
from players
where primary_group_id is not null
on conflict do nothing;

-- 4. Per-coach calendar of holidays / school breaks / specials --------
create table if not exists calendar_days (
  coach_id uuid not null references coaches(id) on delete cascade,
  date date not null,
  type text not null check (type in (
    'feiertag',         -- public holiday
    'kein_unterricht',  -- ad-hoc no-lesson day
    'schulferien',      -- NRW Schulferien
    'sondertermin'      -- camp / tournament / event
  )),
  label text,
  primary key (coach_id, date)
);

create index if not exists calendar_days_coach_idx on calendar_days(coach_id);
create index if not exists calendar_days_date_idx on calendar_days(date);

-- 5. RLS for new tables -----------------------------------------------
alter table group_players enable row level security;
alter table calendar_days enable row level security;

drop policy if exists "open all" on group_players;
drop policy if exists "open all" on calendar_days;

create policy "open all" on group_players  for all using (true) with check (true);
create policy "open all" on calendar_days  for all using (true) with check (true);
