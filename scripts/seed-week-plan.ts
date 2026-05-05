/* eslint-disable no-console */
// Bulk-create training plans for a week from a JSON template file.
// Idempotent: training_plans is upserted per (group_id, week_of); existing
// plan_blocks for that plan are wiped and rebuilt fresh in template order.
// Each exercise referenced gets promoted into the owning coach's space
// (coach_exercises.started_at = now() if previously unset), mirroring what
// the UI does in setBlockExerciseAction so the picker is pre-populated.
//
// Prereqs:
//   1. .env.local has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   2. The exercises referenced by slug exist in the catalog (run
//      scripts/import-exercises.ts first if you've added a new JSON).
//
// Usage:  npx tsx scripts/seed-week-plan.ts [path/to/week_plan.json]
// Default path: public/week_plan_KW19.json

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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- types ------------------------------------------------------

type BlockType = "warm_up" | "technical" | "physical" | "tactical" | "points" | "cool_down";

type TemplateBlock = {
  blockType: BlockType;
  exerciseSlug: string;
  durationMinutes: number | null;
  notes: string | null;
};

type Template = {
  theme?: string;
  blocks: TemplateBlock[];
};

type GroupAssignment = {
  groupId: string;
  groupName?: string;
  template: string;
};

type WeekPlan = {
  weekOf: string;
  label?: string;
  templates: Record<string, Template>;
  groups: GroupAssignment[];
};

type CatalogEntry = { id: string; title: string };
type CatalogRoot = { exercises: CatalogEntry[] };

// ---------- slug → title from JSON sources -----------------------------

function buildSlugTitleMap(): Map<string, string> {
  const sources = ["public/exercises_database.json", "public/new_exercises.json"];
  const map = new Map<string, string>();
  for (const rel of sources) {
    const path = resolve(process.cwd(), rel);
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw err;
    }
    const root = JSON.parse(raw) as CatalogRoot;
    for (const entry of root.exercises) {
      if (entry.id && entry.title) map.set(entry.id, entry.title.trim());
    }
  }
  return map;
}

// ---------- main -------------------------------------------------------

async function main() {
  const planPath = resolve(
    process.cwd(),
    process.argv[2] ?? "public/week_plan_KW19.json",
  );
  const plan = JSON.parse(readFileSync(planPath, "utf8")) as WeekPlan;
  console.log(`Loading week plan: ${planPath}`);
  console.log(`Week of: ${plan.weekOf} (${plan.label ?? ""})`);

  // 1. Resolve every slug used by every assigned group → name → exercise.id
  const slugToTitle = buildSlugTitleMap();
  const referencedSlugs = new Set<string>();
  for (const g of plan.groups) {
    const template = plan.templates[g.template];
    if (!template) {
      console.error(`! group ${g.groupId} references unknown template "${g.template}"`);
      process.exit(1);
    }
    for (const b of template.blocks) referencedSlugs.add(b.exerciseSlug);
  }

  const titleToSlug = new Map<string, string>();
  const titles: string[] = [];
  const missingSlugs: string[] = [];
  for (const slug of referencedSlugs) {
    const title = slugToTitle.get(slug);
    if (!title) {
      missingSlugs.push(slug);
      continue;
    }
    titleToSlug.set(title, slug);
    titles.push(title);
  }
  if (missingSlugs.length) {
    console.error("! Slugs not found in any source JSON:", missingSlugs);
    process.exit(1);
  }

  const { data: rows, error: exErr } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", titles);
  if (exErr) {
    console.error("! exercise lookup failed:", exErr);
    process.exit(1);
  }
  const slugToExerciseId = new Map<string, string>();
  for (const row of rows ?? []) {
    const slug = titleToSlug.get(row.name);
    if (slug) slugToExerciseId.set(slug, row.id);
  }
  const unresolved = [...referencedSlugs].filter((s) => !slugToExerciseId.has(s));
  if (unresolved.length) {
    console.error(
      "! Slugs whose title is not in the exercises table — run scripts/import-exercises.ts first:",
      unresolved,
    );
    process.exit(1);
  }
  console.log(`Resolved ${slugToExerciseId.size} distinct exercise slugs`);

  // 2. For each group: ensure plan, wipe blocks, insert blocks, promote space
  let totalBlocks = 0;
  let totalSpacePromotions = 0;
  for (const g of plan.groups) {
    const template = plan.templates[g.template]!;
    const label = g.groupName ?? g.groupId;

    // 2a. Look up the group + its coach (we need coach_id for coach_exercises)
    const { data: group, error: gErr } = await supabase
      .from("groups")
      .select("id, coach_id")
      .eq("id", g.groupId)
      .maybeSingle();
    if (gErr) {
      console.error(`! group lookup failed for ${label}:`, gErr);
      process.exit(1);
    }
    if (!group) {
      console.error(`! group ${label} (${g.groupId}) does not exist — skipping`);
      continue;
    }

    // 2b. Upsert training_plans (group_id, week_of)
    const { data: existingPlan } = await supabase
      .from("training_plans")
      .select("id")
      .eq("group_id", group.id)
      .eq("week_of", plan.weekOf)
      .maybeSingle();

    let planId: string;
    if (existingPlan) {
      planId = existingPlan.id;
    } else {
      const { data: created, error: insErr } = await supabase
        .from("training_plans")
        .insert({ group_id: group.id, week_of: plan.weekOf })
        .select("id")
        .single();
      if (insErr || !created) {
        console.error(`! training_plans insert failed for ${label}:`, insErr);
        process.exit(1);
      }
      planId = created.id;
    }

    // 2c. Wipe existing blocks then insert fresh
    const { error: delErr } = await supabase
      .from("plan_blocks")
      .delete()
      .eq("plan_id", planId);
    if (delErr) {
      console.error(`! plan_blocks wipe failed for ${label}:`, delErr);
      process.exit(1);
    }

    const blockRows = template.blocks.map((b, i) => ({
      plan_id: planId,
      order_index: i,
      block_type: b.blockType,
      exercise_id: slugToExerciseId.get(b.exerciseSlug) ?? null,
      duration_minutes: b.durationMinutes,
      notes: b.notes,
    }));
    const { error: blkErr } = await supabase.from("plan_blocks").insert(blockRows);
    if (blkErr) {
      console.error(`! plan_blocks insert failed for ${label}:`, blkErr);
      process.exit(1);
    }
    totalBlocks += blockRows.length;

    // 2d. Promote each referenced exercise into this coach's space
    const distinctExerciseIds = [...new Set(blockRows.map((r) => r.exercise_id).filter(Boolean) as string[])];
    for (const exerciseId of distinctExerciseIds) {
      const { data: existingSpace } = await supabase
        .from("coach_exercises")
        .select("started_at")
        .eq("coach_id", group.coach_id)
        .eq("exercise_id", exerciseId)
        .maybeSingle();
      if (!existingSpace) {
        const { error } = await supabase.from("coach_exercises").insert({
          coach_id: group.coach_id,
          exercise_id: exerciseId,
          started_at: new Date().toISOString(),
        });
        if (error) {
          console.error(`! coach_exercises insert failed for ${label} / ${exerciseId}:`, error);
          process.exit(1);
        }
        totalSpacePromotions++;
      } else if (!existingSpace.started_at) {
        const { error } = await supabase
          .from("coach_exercises")
          .update({ started_at: new Date().toISOString() })
          .eq("coach_id", group.coach_id)
          .eq("exercise_id", exerciseId);
        if (error) {
          console.error(`! coach_exercises promote failed for ${label} / ${exerciseId}:`, error);
          process.exit(1);
        }
        totalSpacePromotions++;
      }
    }

    console.log(
      `+ ${label.padEnd(40)} → template ${g.template} · ${blockRows.length} blocks`,
    );
  }

  console.log(
    `\nDone. ${plan.groups.length} groups touched, ${totalBlocks} blocks written, ${totalSpacePromotions} coach_exercises promoted.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
