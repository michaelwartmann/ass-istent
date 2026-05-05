/* eslint-disable no-console */
// Import the curated exercise catalog into the global `exercises` table.
// Reads public/exercises_database.json AND public/new_exercises.json (weekly
// add-ons from Sonnet) in sequence. Idempotent — re-running updates rows
// matched by `name`, never duplicates.
//
// Prereqs:
//   1. supabase/migrations/0002_exercises_video.sql applied in Supabase SQL editor
//   2. .env.local has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//
// Usage: npx tsx scripts/import-exercises.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.warn(`Could not read .env.local at ${path}:`, err);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- types ------------------------------------------------------

type JsonExercise = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  durationMin: number | null;
  equipment: string[];
  playerCount: string | null;
  focus: string[];
  videoUrl: string | null;
};

type JsonRoot = {
  exercises: JsonExercise[];
};

type ExerciseCategory =
  | "warm_up"
  | "technical"
  | "tactical"
  | "physical"
  | "points"
  | "cool_down";
type BallType = "green" | "orange" | "red" | "hard";

type DbRow = {
  name: string;
  description: string | null;
  category: ExerciseCategory;
  ball_type: BallType | null;
  level: string | null;
  group_size_min: number | null;
  group_size_max: number | null;
  duration_minutes: number | null;
  equipment: string | null;
  tags: string[] | null;
  video_url: string | null;
};

// ---------- mapping ----------------------------------------------------

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  "Warm-up": "warm_up",
  "Athletik": "physical",
  "Technik": "technical",
  "Taktik": "tactical",
  "Punktspiel": "points",
  "Cool-down": "cool_down",
};

function mapLevel(level: string): { ball_type: BallType | null; level: string | null } {
  switch (level) {
    case "Orange":
      return { ball_type: "orange", level: null };
    case "Grün":
      return { ball_type: "green", level: null };
    case "Hart":
      return { ball_type: "hard", level: null };
    case "Erwachsene":
      return { ball_type: null, level: "Erwachsene" };
    default:
      return { ball_type: null, level: level || null };
  }
}

function parsePlayerCount(s: string | null): {
  group_size_min: number | null;
  group_size_max: number | null;
} {
  if (!s) return { group_size_min: null, group_size_max: null };
  const t = s.trim();
  let m = t.match(/^(\d+)\s*[–-]\s*(\d+)/);
  if (m) return { group_size_min: +m[1], group_size_max: +m[2] };
  m = t.match(/^(\d+)\+/);
  if (m) return { group_size_min: +m[1], group_size_max: null };
  m = t.match(/^(\d+)$/);
  if (m) return { group_size_min: +m[1], group_size_max: +m[1] };
  return { group_size_min: null, group_size_max: null };
}

function mapJsonRowToDbRow(row: JsonExercise): DbRow {
  const category = CATEGORY_MAP[row.category];
  if (!category) {
    throw new Error(`Unknown category "${row.category}" on "${row.title}"`);
  }
  const { ball_type, level } = mapLevel(row.level);
  const { group_size_min, group_size_max } = parsePlayerCount(row.playerCount);
  return {
    name: row.title.trim(),
    description: row.description?.trim() || null,
    category,
    ball_type,
    level,
    group_size_min,
    group_size_max,
    duration_minutes: row.durationMin ?? null,
    equipment: row.equipment?.length ? row.equipment.join(", ") : null,
    tags: row.focus?.length ? row.focus : null,
    video_url: row.videoUrl?.trim() || null,
  };
}

// ---------- main -------------------------------------------------------

async function importFile(jsonPath: string): Promise<{ inserted: number; updated: number }> {
  let raw: string;
  try {
    raw = readFileSync(jsonPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(`(skip) ${jsonPath} does not exist`);
      return { inserted: 0, updated: 0 };
    }
    throw err;
  }

  const root = JSON.parse(raw) as JsonRoot;
  console.log(`\nImporting ${root.exercises.length} exercises from ${jsonPath}`);

  let inserted = 0;
  let updated = 0;

  for (const entry of root.exercises) {
    const payload = mapJsonRowToDbRow(entry);

    const { data: existing, error: selErr } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", payload.name)
      .maybeSingle();
    if (selErr) {
      console.error(`! select failed for "${payload.name}":`, selErr);
      process.exit(1);
    }

    if (existing) {
      const { error } = await supabase
        .from("exercises")
        .update(payload)
        .eq("id", existing.id);
      if (error) {
        console.error(`! update failed for "${payload.name}":`, error);
        process.exit(1);
      }
      updated++;
      console.log(`= ${payload.name}`);
    } else {
      const { error } = await supabase.from("exercises").insert(payload);
      if (error) {
        console.error(`! insert failed for "${payload.name}":`, error);
        process.exit(1);
      }
      inserted++;
      console.log(`+ ${payload.name}`);
    }
  }

  return { inserted, updated };
}

async function main() {
  const sources = [
    resolve(process.cwd(), "public/exercises_database.json"),
    resolve(process.cwd(), "public/new_exercises.json"),
  ];

  let totalInserted = 0;
  let totalUpdated = 0;
  for (const path of sources) {
    const { inserted, updated } = await importFile(path);
    totalInserted += inserted;
    totalUpdated += updated;
  }

  console.log(`\nDone. ${totalInserted} inserted, ${totalUpdated} updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
