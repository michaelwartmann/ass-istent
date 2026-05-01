/* eslint-disable no-console */
// Seed Michael's actual Mi/Do roster (41 kids) into Supabase.
// Usage: npx tsx scripts/seed-roster.ts
//
// Run AFTER scripts/seed.ts has created the coach + the placeholder groups,
// AND AFTER applying supabase/migrations/0002_roster_calendar.sql in the
// Supabase SQL Editor (creates group_players + new player columns).
// Idempotent — re-runs are safe (skips existing players, upserts joins).

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

type RosterPlayer = { firstName: string; yearOfBirth: number | null };

type RosterSlot = {
  // identifies the existing group row by (day_of_week, start_time)
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  // optional fix-ups when the seed group has stale data
  rename?: string; // new group.name
  setBall?: "green" | "orange" | "red" | "hard";
  // if the slot doesn't exist yet, create it with these fields
  createIfMissing?: {
    name: string;
    endTime: string; // "HH:MM"
    location: string;
    ballType: "green" | "orange" | "red" | "hard";
  };
  players: RosterPlayer[];
};

const roster: RosterSlot[] = [
  // ─── Mittwoch ────────────────────────────────────────────────
  {
    dayOfWeek: 3,
    startTime: "14:00",
    setBall: "hard", // user moved this group to hart in the live DB
    players: [
      { firstName: "Felix", yearOfBirth: 2015 },
      { firstName: "Luuk", yearOfBirth: 2015 },
      { firstName: "Henri", yearOfBirth: 2016 },
      { firstName: "Hugo", yearOfBirth: 2015 },
      { firstName: "Mats", yearOfBirth: 2016 },
    ],
  },
  {
    dayOfWeek: 3,
    startTime: "15:00",
    players: [
      { firstName: "Johanna", yearOfBirth: 2018 },
      { firstName: "Bjarne", yearOfBirth: 2017 },
      { firstName: "Milan", yearOfBirth: 2017 },
      { firstName: "Wilma", yearOfBirth: 2017 },
      { firstName: "Jonah", yearOfBirth: 2017 },
      { firstName: "Jonas", yearOfBirth: 2017 },
    ],
  },
  {
    dayOfWeek: 3,
    startTime: "16:00",
    players: [
      { firstName: "Lilly", yearOfBirth: 2014 },
      { firstName: "Lina", yearOfBirth: 2015 },
      { firstName: "Nelly", yearOfBirth: 2015 },
      { firstName: "Florentine", yearOfBirth: null },
      { firstName: "Leni-Lou", yearOfBirth: null },
    ],
  },
  {
    dayOfWeek: 3,
    startTime: "17:00",
    players: [
      { firstName: "Emma", yearOfBirth: 2012 },
      { firstName: "Sophia", yearOfBirth: 2009 },
      { firstName: "Marla", yearOfBirth: 2009 },
      { firstName: "Hannah", yearOfBirth: 2008 },
    ],
  },
  // ─── Donnerstag ──────────────────────────────────────────────
  {
    dayOfWeek: 4,
    startTime: "15:00",
    players: [
      { firstName: "Janne", yearOfBirth: 2017 },
      { firstName: "Enno", yearOfBirth: 2017 },
      { firstName: "Nuno", yearOfBirth: 2016 },
      { firstName: "Henri", yearOfBirth: null },
      { firstName: "Marlene", yearOfBirth: null },
    ],
  },
  {
    dayOfWeek: 4,
    startTime: "16:00",
    rename: "7er Mädchen",
    players: [
      { firstName: "Johanna", yearOfBirth: 2013 },
      { firstName: "Leonie", yearOfBirth: 2014 },
      { firstName: "Anna-Lena", yearOfBirth: 2014 },
      { firstName: "Lea", yearOfBirth: 2014 },
      { firstName: "Svea", yearOfBirth: 2011 },
      { firstName: "Marlene", yearOfBirth: 2012 },
      { firstName: "Ylva", yearOfBirth: 2013 },
    ],
  },
  {
    dayOfWeek: 4,
    startTime: "17:00",
    createIfMissing: {
      name: "5er Mixed",
      endTime: "18:00",
      location: "Tennisschule",
      ballType: "hard",
    },
    players: [
      { firstName: "Charlotte", yearOfBirth: 2015 },
      { firstName: "Hannah", yearOfBirth: 2014 },
      { firstName: "Felix", yearOfBirth: 2014 },
      { firstName: "Carl", yearOfBirth: 2015 },
      { firstName: "Frieda", yearOfBirth: null },
    ],
  },
  {
    dayOfWeek: 4,
    startTime: "18:00",
    players: [
      { firstName: "Lara", yearOfBirth: 2009 },
      { firstName: "Marie", yearOfBirth: 2013 },
      { firstName: "Christina", yearOfBirth: 1996 },
      { firstName: "Sophie", yearOfBirth: 1996 },
    ],
  },
];

async function getCoachId(): Promise<string> {
  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("name", COACH_NAME)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `Coach "${COACH_NAME}" not found. Run scripts/seed.ts first.`,
    );
  }
  return data.id as string;
}

async function ensureGroup(
  coachId: string,
  slot: RosterSlot,
): Promise<string> {
  const startTime = `${slot.startTime}:00`;
  const { data: existing, error: selErr } = await supabase
    .from("groups")
    .select("id, name, ball_type")
    .eq("coach_id", coachId)
    .eq("day_of_week", slot.dayOfWeek)
    .eq("start_time", startTime)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const update: Record<string, unknown> = {};
    if (slot.rename && existing.name !== slot.rename) update.name = slot.rename;
    if (slot.setBall && existing.ball_type !== slot.setBall)
      update.ball_type = slot.setBall;
    if (Object.keys(update).length) {
      const { error } = await supabase
        .from("groups")
        .update(update)
        .eq("id", existing.id);
      if (error) throw error;
      console.log(
        `  updated group day=${slot.dayOfWeek} ${slot.startTime}:`,
        update,
      );
    }
    return existing.id as string;
  }

  if (!slot.createIfMissing) {
    throw new Error(
      `No group found at day=${slot.dayOfWeek} ${slot.startTime} and no createIfMissing — cowardly refusing to guess.`,
    );
  }
  const c = slot.createIfMissing;
  const { data: created, error } = await supabase
    .from("groups")
    .insert({
      coach_id: coachId,
      name: c.name,
      day_of_week: slot.dayOfWeek,
      start_time: startTime,
      end_time: `${c.endTime}:00`,
      location: c.location,
      ball_type: c.ballType,
    })
    .select("id")
    .single();
  if (error) throw error;
  console.log(`  created new group "${c.name}" (day=${slot.dayOfWeek} ${slot.startTime})`);
  return created.id as string;
}

async function ensurePlayer(
  coachId: string,
  groupId: string,
  p: RosterPlayer,
): Promise<string> {
  // Idempotency key: (coach_id, first_name, year_of_birth, primary_group_id).
  // For a slot's seed list, all kids land in the slot as their primary group.
  const lookup = supabase
    .from("players")
    .select("id")
    .eq("coach_id", coachId)
    .eq("first_name", p.firstName)
    .eq("primary_group_id", groupId);

  const { data: existing, error: selErr } = (
    p.yearOfBirth == null
      ? await lookup.is("year_of_birth", null).maybeSingle()
      : await lookup.eq("year_of_birth", p.yearOfBirth).maybeSingle()
  );
  if (selErr) throw selErr;
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("players")
    .insert({
      coach_id: coachId,
      first_name: p.firstName,
      year_of_birth: p.yearOfBirth,
      primary_group_id: groupId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id as string;
}

async function ensureGroupPlayer(groupId: string, playerId: string) {
  const { error } = await supabase
    .from("group_players")
    .upsert(
      { group_id: groupId, player_id: playerId },
      { onConflict: "group_id,player_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

async function main() {
  console.log(`Seeding ${COACH_NAME}'s roster…`);
  const coachId = await getCoachId();
  console.log(`Coach id: ${coachId}`);

  let totalKids = 0;
  for (const slot of roster) {
    console.log(
      `\nDay ${slot.dayOfWeek} @ ${slot.startTime} — ${slot.players.length} kid(s)`,
    );
    const groupId = await ensureGroup(coachId, slot);
    for (const p of slot.players) {
      const playerId = await ensurePlayer(coachId, groupId, p);
      await ensureGroupPlayer(groupId, playerId);
      totalKids++;
    }
  }

  console.log(`\nDone. ${totalKids} player rows ensured.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
