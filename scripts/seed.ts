/* eslint-disable no-console */
// Seed groups + exercises into Supabase.
// Usage: npx tsx scripts/seed.ts

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

type GroupSeed = {
  name: string;
  day_of_week: number; // 1 = Mon ... 7 = Sun
  start_time: string;
  end_time: string;
  location: string;
  ball_type: string | null;
};

const groups: GroupSeed[] = [
  {
    name: "5er Jungen — Übergang grün → hart",
    day_of_week: 3,
    start_time: "14:00",
    end_time: "15:00",
    location: "Tennisschule",
    ball_type: "green",
  },
  {
    name: "6er Midcourt",
    day_of_week: 3,
    start_time: "15:00",
    end_time: "16:00",
    location: "Tennisschule",
    ball_type: "orange",
  },
  {
    name: "Mädchengruppe — Übergang hart",
    day_of_week: 3,
    start_time: "16:00",
    end_time: "17:00",
    location: "Tennisschule",
    ball_type: "hard",
  },
  {
    name: "4er Mädchen 17J",
    day_of_week: 3,
    start_time: "17:00",
    end_time: "18:00",
    location: "Tennisschule",
    ball_type: "hard",
  },
  {
    name: "VHS Anfängerkurs (5x)",
    day_of_week: 3,
    start_time: "18:30",
    end_time: "19:30",
    location: "VHS",
    ball_type: "hard",
  },
  {
    name: "TuB Hobbytreff",
    day_of_week: 3,
    start_time: "18:00",
    end_time: "19:00",
    location: "TuB Bocholt",
    ball_type: "hard",
  },
  {
    name: "Midcourt Gruppe",
    day_of_week: 4,
    start_time: "15:00",
    end_time: "16:00",
    location: "Tennisschule",
    ball_type: "orange",
  },
  {
    name: "6er Mädchen",
    day_of_week: 4,
    start_time: "16:00",
    end_time: "17:00",
    location: "Tennisschule",
    ball_type: "orange",
  },
  {
    name: "Damen II",
    day_of_week: 4,
    start_time: "18:00",
    end_time: "19:00",
    location: "TuB Bocholt",
    ball_type: "hard",
  },
  {
    name: "2er Herren",
    day_of_week: 4,
    start_time: "19:00",
    end_time: "20:00",
    location: "Tennisschule",
    ball_type: "hard",
  },
];

type ExerciseSeed = {
  name: string;
  category:
    | "warm_up"
    | "technical"
    | "tactical"
    | "physical"
    | "points"
    | "cool_down";
  duration_minutes: number;
  description: string;
};

const exercises: ExerciseSeed[] = [
  // WARM_UP
  {
    name: "Ballgewöhnung solo",
    category: "warm_up",
    duration_minutes: 5,
    description: "Bälle prellen, jonglieren, hochwerfen-fangen.",
  },
  {
    name: "Mini-Tennis Service Box",
    category: "warm_up",
    duration_minutes: 6,
    description: "Leichte VH/RH cross aus Service Box. Kontrolle vor Power.",
  },
  {
    name: "Lauf-ABC am Netz",
    category: "warm_up",
    duration_minutes: 5,
    description: "Side-shuffle, Kreuztippeln, Sprint Netz und zurück.",
  },
  {
    name: "Easy Rallye mid-court",
    category: "warm_up",
    duration_minutes: 5,
    description: "Lange Bälle mid-court, Fokus Treffpunkt.",
  },
  // TECHNICAL
  {
    name: "Cross VH",
    category: "technical",
    duration_minutes: 8,
    description: "Trainer wirft, Spieler spielt VH cross in Hütchen-Zone.",
  },
  {
    name: "Long-line RH",
    category: "technical",
    duration_minutes: 8,
    description: "Wie oben, RH long-line.",
  },
  {
    name: "Volley Setup am Netz",
    category: "technical",
    duration_minutes: 8,
    description: "Trainer wirft kurz, Spieler stop-volleyt zurück.",
  },
  {
    name: "Aufschlag-Routine",
    category: "technical",
    duration_minutes: 10,
    description: "10 Aufschläge pro Seite, Fokus auf Wurf.",
  },
  {
    name: "Slice RH",
    category: "technical",
    duration_minutes: 8,
    description: "Technik-Drill, slice cross.",
  },
  {
    name: "Return tief & mittig",
    category: "technical",
    duration_minutes: 8,
    description: "Angeworfener Ball, Spieler returniert tief mittig.",
  },
  // PHYSICAL
  {
    name: "Koordinationsleiter",
    category: "physical",
    duration_minutes: 4,
    description: "Side-step, in-out, 2 Runden.",
  },
  {
    name: "Linien-Sprints",
    category: "physical",
    duration_minutes: 3,
    description: "Grundlinie → Service Box → Netz → zurück, 5x.",
  },
  {
    name: "Reaktion mit Ball",
    category: "physical",
    duration_minutes: 3,
    description:
      "Trainer wirft links/rechts ohne Ankündigung, Spieler fängt.",
  },
  // TACTICAL
  {
    name: "Cross-Plus-Eins",
    category: "tactical",
    duration_minutes: 10,
    description: "2 Bälle cross, dritter long-line winner.",
  },
  {
    name: "Aufschlag + VH-Angriff",
    category: "tactical",
    duration_minutes: 10,
    description: "Aufschlag, nächster Ball mit VH attackieren.",
  },
  {
    name: "Zonen-Spiel rot/gelb/grün",
    category: "tactical",
    duration_minutes: 12,
    description:
      "Spieler entscheidet je nach Ball: sicher/aufbauen/angreifen.",
  },
  {
    name: "Cross vs Long-Line",
    category: "tactical",
    duration_minutes: 10,
    description: "A nur cross, B nur long-line. Taktisches Stellungsspiel.",
  },
  // POINTS
  {
    name: "King of the Court",
    category: "points",
    duration_minutes: 15,
    description: "Sieger bleibt, 1-Punkt-Spiele, Rotation.",
  },
  {
    name: "21-Punkte Halbfeld",
    category: "points",
    duration_minutes: 15,
    description: "Zu 21 Punkten cross-Halbfeld.",
  },
  {
    name: "Erste zu 7",
    category: "points",
    duration_minutes: 12,
    description: "Mini-Match, abwechselnd Aufschlag, zu 7 Punkten.",
  },
  // COOL_DOWN
  {
    name: "Lockeres Cross",
    category: "cool_down",
    duration_minutes: 5,
    description: "Rallyen ohne Druck.",
  },
  {
    name: "Stretching",
    category: "cool_down",
    duration_minutes: 5,
    description: "Klassische Tennis-Stretches.",
  },
];

async function upsertGroups() {
  console.log(`Seeding ${groups.length} groups...`);
  for (const g of groups) {
    const { data: existing, error: selErr } = await supabase
      .from("groups")
      .select("id")
      .eq("name", g.name)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) {
      const { error } = await supabase
        .from("groups")
        .update(g)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("groups").insert(g);
      if (error) throw error;
    }
  }
}

async function upsertExercises() {
  console.log(`Seeding ${exercises.length} exercises...`);
  for (const ex of exercises) {
    const { data: existing, error: selErr } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", ex.name)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) {
      const { error } = await supabase
        .from("exercises")
        .update(ex)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("exercises").insert(ex);
      if (error) throw error;
    }
  }
}

async function main() {
  await upsertGroups();
  await upsertExercises();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
