-- 0004_group_niveau.sql
-- Adds a Niveau classification to each group so the Lehrplan tab can
-- bucket groups by curriculum level (Sommer 2026).
--
-- Niveau values:
--   n1  — Niveau 1 (Erwachsene / Fortgeschritten)
--   n2  — Niveau 2 (Hart-Mixed Jugend)
--   n3  — Niveau 3 (Orange)
--   vhs — Sondergruppe (VHS Anfängerkurs + Hobbytreff)
--
-- Paste into the Supabase SQL Editor (project: EU-Frankfurt) and run.
-- Idempotent — safe to re-run.

alter table groups
  add column if not exists niveau text;

-- Drop + re-add the check constraint so re-runs are safe.
alter table groups
  drop constraint if exists groups_niveau_check;

alter table groups
  add constraint groups_niveau_check
  check (niveau is null or niveau in ('n1','n2','n3','vhs'));

create index if not exists groups_niveau_idx on groups(niveau);

-- Seed assignments by name. Only update rows that haven't been classified
-- yet so manual re-classifications survive a re-run.
update groups set niveau = 'n1'
 where niveau is null
   and name in ('Damen II', '2er Herren', '4er Mädchen 17J');

update groups set niveau = 'n2'
 where niveau is null
   and name in (
     '5er Jungen — Übergang grün → hart',
     'Mädchengruppe — Übergang hart',
     '5er Mixed',
     '7er Mädchen',
     '6er Mädchen'
   );

update groups set niveau = 'n3'
 where niveau is null
   and name in ('6er Midcourt', 'Midcourt Gruppe');

update groups set niveau = 'vhs'
 where niveau is null
   and name in ('VHS Anfängerkurs (5x)', 'TuB Hobbytreff');
