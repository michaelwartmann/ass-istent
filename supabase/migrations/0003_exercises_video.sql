-- 0003 — Exercises: optional YouTube demo URL.
-- Used by scripts/import-exercises.ts when seeding the curated catalog
-- (~117 of 120 rows have a video link) and by the exercise edit form.

alter table exercises add column if not exists video_url text;
