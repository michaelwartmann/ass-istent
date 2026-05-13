-- 0005_demo_coach.sql
-- Adds an is_demo flag so a coach can be marked as a shared example
-- setup. Other logged-in coaches can then enter "Demo-Modus" in
-- Settings and view this coach's data read-only.
--
-- After running the migration, mark the source coach manually, e.g.:
--   update coaches set is_demo = true where name = 'Michael';
--
-- Verify:
--   select id, name, is_demo from coaches order by name;
--
-- Paste into the Supabase SQL Editor (project: EU-Frankfurt) and run.
-- Idempotent — safe to re-run.

alter table coaches
  add column if not exists is_demo boolean not null default false;

create index if not exists coaches_is_demo_idx
  on coaches(is_demo)
  where is_demo;
