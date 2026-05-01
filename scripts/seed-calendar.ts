/* eslint-disable no-console */
// Seed Michael's 2026 season calendar (Feiertage, Schulferien NRW,
// Sondertermine) into Supabase.
//
// Usage: npx tsx scripts/seed-calendar.ts
//
// Run AFTER scripts/seed.ts and AFTER applying
// supabase/migrations/0002_roster_calendar.sql.
// Idempotent — re-runs are safe (upserts on (coach_id, date)).

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
  auth: { persistSession: false },
});

const COACH_NAME = "Michael";

type DayRow = {
  date: string; // YYYY-MM-DD
  type: "feiertag" | "kein_unterricht" | "schulferien" | "sondertermin";
  label: string | null;
};

function dateRange(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  for (let d = start; d.getTime() <= end.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

function build2026(): DayRow[] {
  const out: DayRow[] = [];

  // ─── NRW Feiertage ─────────────────────────────────────────────
  const feiertage: { date: string; label: string }[] = [
    { date: "2026-05-01", label: "Tag der Arbeit" },
    { date: "2026-05-14", label: "Christi Himmelfahrt" },
    { date: "2026-05-25", label: "Pfingstmontag" },
    { date: "2026-06-04", label: "Fronleichnam" },
  ];
  for (const f of feiertage) {
    out.push({ date: f.date, type: "feiertag", label: f.label });
  }

  // ─── NRW Schulferien Sommer 2026 ──────────────────────────────
  // Sommerferien NRW: 25.06.–07.08.2026
  for (const date of dateRange("2026-06-25", "2026-08-07")) {
    out.push({ date, type: "schulferien", label: "Sommerferien NRW" });
  }

  // ─── Sondertermine (vom Trainer-Kalender) ─────────────────────
  for (const date of dateRange("2026-07-19", "2026-07-22")) {
    out.push({ date, type: "sondertermin", label: "Jugendcamp" });
  }
  for (const date of dateRange("2026-08-28", "2026-08-30")) {
    out.push({
      date,
      type: "sondertermin",
      label: "Sparkasse Westmünsterland Cup (Dunlop Junior)",
    });
  }
  out.push({
    date: "2026-09-27",
    type: "sondertermin",
    label: "48. Top10 LK-Tagesturnier",
  });

  // De-duplicate: a Feiertag inside Sommerferien stays as Feiertag (more
  // specific). Sondertermin overrides Schulferien on the same date. For
  // simplicity, last-write-wins by (date), priority: sondertermin >
  // feiertag > schulferien.
  const priority: Record<DayRow["type"], number> = {
    sondertermin: 3,
    feiertag: 2,
    kein_unterricht: 2,
    schulferien: 1,
  };
  const byDate = new Map<string, DayRow>();
  for (const row of out) {
    const existing = byDate.get(row.date);
    if (!existing || priority[row.type] >= priority[existing.type]) {
      byDate.set(row.date, row);
    }
  }
  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

async function main() {
  const { data: coach, error: cErr } = await supabase
    .from("coaches")
    .select("id")
    .eq("name", COACH_NAME)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!coach) {
    throw new Error(
      `Coach "${COACH_NAME}" not found. Run scripts/seed.ts first.`,
    );
  }
  const coachId = coach.id as string;

  const rows = build2026();
  console.log(`Upserting ${rows.length} calendar days for ${COACH_NAME}…`);

  const payload = rows.map((r) => ({ coach_id: coachId, ...r }));
  const { error } = await supabase
    .from("calendar_days")
    .upsert(payload, { onConflict: "coach_id,date" });
  if (error) throw error;
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
