"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { BlockType, NoteCategory } from "@/lib/types";

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
  const supabase = await getSupabaseServer();
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
  const supabase = await getSupabaseServer();
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
  const supabase = await getSupabaseServer();
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
  const supabase = await getSupabaseServer();
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
}) {
  if (!input.content.trim()) return;
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("player_notes").insert({
    player_id: input.playerId,
    category: input.category,
    content: input.content.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/players/${input.playerId}`);
}

export async function deletePlayerNoteAction(input: {
  playerId: string;
  noteId: string;
}) {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("player_notes")
    .delete()
    .eq("id", input.noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/players/${input.playerId}`);
}

// ---------- players ----------------------------------------------

export async function createPlayerAction(input: {
  firstName: string;
  lastName?: string;
  yearOfBirth?: number;
  primaryGroupId?: string;
  dominantHand?: "right" | "left";
}) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("players")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName ?? null,
      year_of_birth: input.yearOfBirth ?? null,
      primary_group_id: input.primaryGroupId ?? null,
      dominant_hand: input.dominantHand ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (input.primaryGroupId) {
    revalidatePath(`/groups/${input.primaryGroupId}`);
  }
  revalidatePath("/players");
  return data?.id as string | undefined;
}

// ---------- exercises --------------------------------------------

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
  revalidatePath("/exercises");
  return data?.id as string | undefined;
}
