"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import type { Backhand, BlockType, Hand, NoteCategory } from "@/lib/types";

// All actions run with a coach session. They thread coach_id through writes
// and verify ownership before mutating existing rows — RLS is open at the DB
// layer, so this is the only line of defense against forged IDs.

// ---------- ownership helpers --------------------------------------

async function assertGroupOwned(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  groupId: string,
  coachId: string,
) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, coach_id")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.coach_id !== coachId) {
    throw new Error("not-found");
  }
}

async function assertPlayerOwned(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  playerId: string,
  coachId: string,
) {
  const { data, error } = await supabase
    .from("players")
    .select("id, coach_id")
    .eq("id", playerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.coach_id !== coachId) {
    throw new Error("not-found");
  }
}

async function assertBlockOwned(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  blockId: string,
  coachId: string,
) {
  // plan_blocks → training_plans → groups.coach_id
  const { data, error } = await supabase
    .from("plan_blocks")
    .select("id, plan:training_plans(group:groups(coach_id))")
    .eq("id", blockId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  type Joined = {
    id: string;
    plan: { group: { coach_id: string } | { coach_id: string }[] | null }
      | { group: { coach_id: string } | { coach_id: string }[] | null }[]
      | null;
  };
  const row = data as Joined | null;
  if (!row) throw new Error("not-found");
  const planRaw = row.plan;
  const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
  const groupRaw = plan?.group;
  const group = Array.isArray(groupRaw) ? groupRaw[0] : groupRaw;
  if (!group || group.coach_id !== coachId) {
    throw new Error("not-found");
  }
}

async function assertNoteOwned(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  noteId: string,
  coachId: string,
) {
  const { data, error } = await supabase
    .from("player_notes")
    .select("id, player:players(coach_id)")
    .eq("id", noteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  type Joined = {
    id: string;
    player: { coach_id: string } | { coach_id: string }[] | null;
  };
  const row = data as Joined | null;
  if (!row) throw new Error("not-found");
  const playerRaw = row.player;
  const player = Array.isArray(playerRaw) ? playerRaw[0] : playerRaw;
  if (!player || player.coach_id !== coachId) {
    throw new Error("not-found");
  }
}

// ---------- groups ------------------------------------------------

export type GroupInput = {
  name: string;
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string;
  location: string;
  ball_type: "green" | "orange" | "red" | "hard" | null;
  level: string | null;
  age_band: string | null;
  notes: string | null;
};

function normalizeGroupInput(input: GroupInput) {
  return {
    name: input.name.trim(),
    day_of_week: input.day_of_week,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location.trim(),
    ball_type: input.ball_type,
    level: input.level?.trim() || null,
    age_band: input.age_band?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createGroupAction(input: GroupInput): Promise<string> {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  const payload = { coach_id: coachId, ...normalizeGroupInput(input) };
  const { data, error } = await supabase
    .from("groups")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return data.id as string;
}

export async function updateGroupAction(input: {
  groupId: string;
  fields: GroupInput;
}): Promise<void> {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  const { error } = await supabase
    .from("groups")
    .update(normalizeGroupInput(input.fields))
    .eq("id", input.groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/groups/${input.groupId}`);
}

export async function deleteGroupAction(input: {
  groupId: string;
}): Promise<void> {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", input.groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---------- training plans / blocks ------------------------------

async function ensurePlan(groupId: string, weekOf: string) {
  const supabase = await getSupabaseServer();
  const { data: existing, error: selErr } = await supabase
    .from("training_plans")
    .select("id")
    .eq("group_id", groupId)
    .eq("week_of", weekOf)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("training_plans")
    .insert({ group_id: groupId, week_of: weekOf })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

export async function addBlockAction(input: {
  groupId: string;
  weekOf: string;
  blockType: BlockType;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);

  const planId = await ensurePlan(input.groupId, input.weekOf);

  const { data: existing } = await supabase
    .from("plan_blocks")
    .select("order_index")
    .eq("plan_id", planId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIdx = (existing?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from("plan_blocks").insert({
    plan_id: planId,
    order_index: nextIdx,
    block_type: input.blockType,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/groups/${input.groupId}`);
}

export async function setBlockExerciseAction(input: {
  groupId: string;
  blockId: string;
  exerciseId: string | null;
  durationMinutes: number | null;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  await assertBlockOwned(supabase, input.blockId, coachId);

  // Coach can only assign exercises that are in their space.
  if (input.exerciseId) {
    const { data: inSpace } = await supabase
      .from("coach_exercises")
      .select("started_at")
      .eq("coach_id", coachId)
      .eq("exercise_id", input.exerciseId)
      .maybeSingle();
    if (!inSpace) throw new Error("exercise-not-in-space");

    // First time using this exercise → mark it "Im Einsatz" (started).
    if (!inSpace.started_at) {
      const { error: startErr } = await supabase
        .from("coach_exercises")
        .update({ started_at: new Date().toISOString() })
        .eq("coach_id", coachId)
        .eq("exercise_id", input.exerciseId);
      if (startErr) throw new Error(startErr.message);
    }
  }

  const { error } = await supabase
    .from("plan_blocks")
    .update({
      exercise_id: input.exerciseId,
      duration_minutes: input.durationMinutes,
    })
    .eq("id", input.blockId);
  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${input.groupId}`);
}

export async function moveBlockAction(input: {
  groupId: string;
  blockId: string;
  direction: "up" | "down";
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  await assertBlockOwned(supabase, input.blockId, coachId);

  const { data: block, error: bErr } = await supabase
    .from("plan_blocks")
    .select("id,plan_id,order_index")
    .eq("id", input.blockId)
    .single();
  if (bErr) throw new Error(bErr.message);

  const base = supabase
    .from("plan_blocks")
    .select("id,order_index")
    .eq("plan_id", block.plan_id);
  const filtered =
    input.direction === "up"
      ? base.lt("order_index", block.order_index).order("order_index", {
          ascending: false,
        })
      : base.gt("order_index", block.order_index).order("order_index", {
          ascending: true,
        });
  const { data: neighbour } = await filtered.limit(1).maybeSingle();

  if (!neighbour) return;

  const { error: e1 } = await supabase
    .from("plan_blocks")
    .update({ order_index: neighbour.order_index })
    .eq("id", block.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase
    .from("plan_blocks")
    .update({ order_index: block.order_index })
    .eq("id", neighbour.id);
  if (e2) throw new Error(e2.message);

  revalidatePath(`/groups/${input.groupId}`);
}

export async function deleteBlockAction(input: {
  groupId: string;
  blockId: string;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  await assertBlockOwned(supabase, input.blockId, coachId);

  const { error } = await supabase
    .from("plan_blocks")
    .delete()
    .eq("id", input.blockId);
  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${input.groupId}`);
}

// ---------- player notes ------------------------------------------

export async function addPlayerNoteAction(input: {
  playerId: string;
  category: NoteCategory;
  content: string;
  noteDate?: string; // "YYYY-MM-DD"; defaults to today (Europe/Berlin)
}) {
  if (!input.content.trim()) return;
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertPlayerOwned(supabase, input.playerId, coachId);

  const noteDate = input.noteDate ?? todayBerlin();

  const { error } = await supabase.from("player_notes").insert({
    player_id: input.playerId,
    category: input.category,
    content: input.content.trim(),
    note_date: noteDate,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/players/${input.playerId}`);
  revalidatePath(`/day/${noteDate}`);
}

function todayBerlin(): string {
  // YYYY-MM-DD in Europe/Berlin (timezone of TuB Bocholt).
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function deletePlayerNoteAction(input: {
  playerId: string;
  noteId: string;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertNoteOwned(supabase, input.noteId, coachId);

  const { error } = await supabase
    .from("player_notes")
    .delete()
    .eq("id", input.noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/players/${input.playerId}`);
}

// ---------- players ----------------------------------------------

export type PlayerInput = {
  firstName: string;
  lastName?: string | null;
  yearOfBirth?: number | null;
  primaryGroupId?: string | null;
  dominantHand?: Hand | null;
  backhand?: Backhand | null;
  level?: string | null;
  parentContact?: string | null;
  description?: string | null;
  goalTechnical?: string | null;
  goalTactical?: string | null;
  goalPhysical?: string | null;
  goalMental?: string | null;
};

function normalizePlayerPayload(input: PlayerInput) {
  const trim = (s: string | null | undefined) =>
    s == null ? null : s.trim() || null;
  return {
    first_name: input.firstName.trim(),
    last_name: trim(input.lastName),
    year_of_birth: input.yearOfBirth ?? null,
    primary_group_id: input.primaryGroupId ?? null,
    dominant_hand: input.dominantHand ?? null,
    backhand: input.backhand ?? null,
    level: trim(input.level),
    parent_contact: trim(input.parentContact),
    description: trim(input.description),
    goal_technical: trim(input.goalTechnical),
    goal_tactical: trim(input.goalTactical),
    goal_physical: trim(input.goalPhysical),
    goal_mental: trim(input.goalMental),
  };
}

export async function createPlayerAction(input: PlayerInput) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  if (input.primaryGroupId) {
    await assertGroupOwned(supabase, input.primaryGroupId, coachId);
  }

  const { data, error } = await supabase
    .from("players")
    .insert({ coach_id: coachId, ...normalizePlayerPayload(input) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Mirror primary_group_id into group_players so the multi-group view
  // sees the kid right away.
  if (input.primaryGroupId && data?.id) {
    const { error: gpErr } = await supabase
      .from("group_players")
      .upsert(
        { group_id: input.primaryGroupId, player_id: data.id },
        { onConflict: "group_id,player_id", ignoreDuplicates: true },
      );
    if (gpErr) throw new Error(gpErr.message);
  }

  if (input.primaryGroupId) {
    revalidatePath(`/groups/${input.primaryGroupId}`);
  }
  revalidatePath("/players");
  return data?.id as string | undefined;
}

export async function updatePlayerAction(input: {
  playerId: string;
  fields: PlayerInput;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertPlayerOwned(supabase, input.playerId, coachId);

  if (input.fields.primaryGroupId) {
    await assertGroupOwned(supabase, input.fields.primaryGroupId, coachId);
  }

  const { error } = await supabase
    .from("players")
    .update(normalizePlayerPayload(input.fields))
    .eq("id", input.playerId);
  if (error) throw new Error(error.message);

  // Keep group_players in sync when primary group changes — but don't
  // remove other group memberships the player may have. Just add the new
  // primary, if any.
  if (input.fields.primaryGroupId) {
    const { error: gpErr } = await supabase
      .from("group_players")
      .upsert(
        {
          group_id: input.fields.primaryGroupId,
          player_id: input.playerId,
        },
        { onConflict: "group_id,player_id", ignoreDuplicates: true },
      );
    if (gpErr) throw new Error(gpErr.message);
  }

  revalidatePath(`/players/${input.playerId}`);
  revalidatePath("/players");
  if (input.fields.primaryGroupId) {
    revalidatePath(`/groups/${input.fields.primaryGroupId}`);
  }
}

// ---------- group ↔ player join (multi-group) -------------------

export async function addPlayerToGroupAction(input: {
  playerId: string;
  groupId: string;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  await assertPlayerOwned(supabase, input.playerId, coachId);

  const { error } = await supabase
    .from("group_players")
    .upsert(
      { group_id: input.groupId, player_id: input.playerId },
      { onConflict: "group_id,player_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/groups/${input.groupId}`);
  revalidatePath(`/players/${input.playerId}`);
}

export async function removePlayerFromGroupAction(input: {
  playerId: string;
  groupId: string;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  await assertGroupOwned(supabase, input.groupId, coachId);
  await assertPlayerOwned(supabase, input.playerId, coachId);

  const { error } = await supabase
    .from("group_players")
    .delete()
    .eq("group_id", input.groupId)
    .eq("player_id", input.playerId);
  if (error) throw new Error(error.message);

  // If this group was the player's primary, clear the primary too.
  const { data: player } = await supabase
    .from("players")
    .select("primary_group_id")
    .eq("id", input.playerId)
    .maybeSingle();
  if (player?.primary_group_id === input.groupId) {
    await supabase
      .from("players")
      .update({ primary_group_id: null })
      .eq("id", input.playerId);
  }

  revalidatePath(`/groups/${input.groupId}`);
  revalidatePath(`/players/${input.playerId}`);
}

// ---------- exercises (global catalog) ---------------------------

export async function createExerciseAction(input: {
  name: string;
  category:
    | "warm_up"
    | "technical"
    | "tactical"
    | "physical"
    | "points"
    | "cool_down";
  description?: string;
  durationMinutes?: number;
  ballType?: "green" | "orange" | "red" | "hard";
  level?: string;
  groupSizeMin?: number;
  groupSizeMax?: number;
  equipment?: string;
  tags?: string[];
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      duration_minutes: input.durationMinutes ?? null,
      ball_type: input.ballType ?? null,
      level: input.level ?? null,
      group_size_min: input.groupSizeMin ?? null,
      group_size_max: input.groupSizeMax ?? null,
      equipment: input.equipment ?? null,
      tags: input.tags ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Author auto-adds the new exercise to their own space, in active rotation.
  if (data?.id) {
    await supabase.from("coach_exercises").insert({
      coach_id: coachId,
      exercise_id: data.id,
      started_at: new Date().toISOString(),
    });
  }

  revalidatePath("/exercises");
  return data?.id as string | undefined;
}

// ---------- coach exercise space ---------------------------------

export async function addExerciseToSpaceAction(input: {
  exerciseId: string;
  started?: boolean;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();

  // Verify exercise exists in global catalog
  const { data: ex } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", input.exerciseId)
    .maybeSingle();
  if (!ex) throw new Error("not-found");

  const { error } = await supabase.from("coach_exercises").upsert(
    {
      coach_id: coachId,
      exercise_id: input.exerciseId,
      started_at: input.started ? new Date().toISOString() : null,
    },
    { onConflict: "coach_id,exercise_id", ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
}

export async function removeExerciseFromSpaceAction(input: {
  exerciseId: string;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("coach_exercises")
    .delete()
    .eq("coach_id", coachId)
    .eq("exercise_id", input.exerciseId);
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
}

export async function setSpaceExerciseStartedAction(input: {
  exerciseId: string;
  started: boolean;
}) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("coach_exercises")
    .update({
      started_at: input.started ? new Date().toISOString() : null,
    })
    .eq("coach_id", coachId)
    .eq("exercise_id", input.exerciseId);
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
}

export type ExerciseInput = {
  name: string;
  category:
    | "warm_up"
    | "technical"
    | "tactical"
    | "physical"
    | "points"
    | "cool_down";
  description?: string | null;
  durationMinutes?: number | null;
  ballType?: "green" | "orange" | "red" | "hard" | null;
  level?: string | null;
  groupSizeMin?: number | null;
  groupSizeMax?: number | null;
  equipment?: string | null;
  tags?: string[] | null;
};

function normalizeExercisePayload(input: ExerciseInput) {
  const trim = (s: string | null | undefined) =>
    s == null ? null : s.trim() || null;
  return {
    name: input.name.trim(),
    category: input.category,
    description: trim(input.description),
    duration_minutes: input.durationMinutes ?? null,
    ball_type: input.ballType ?? null,
    level: trim(input.level),
    group_size_min: input.groupSizeMin ?? null,
    group_size_max: input.groupSizeMax ?? null,
    equipment: trim(input.equipment),
    tags: input.tags && input.tags.length ? input.tags : null,
  };
}

export async function updateExerciseAction(input: {
  exerciseId: string;
  fields: ExerciseInput;
}) {
  // Exercises are global; any logged-in coach can edit. Cheap guard rail
  // to avoid anonymous edits.
  await requireCoachId();
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("exercises")
    .update(normalizeExercisePayload(input.fields))
    .eq("id", input.exerciseId);
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${input.exerciseId}`);
}
