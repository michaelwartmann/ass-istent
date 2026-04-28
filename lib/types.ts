export type BallType = "green" | "orange" | "red" | "hard";
export type Hand = "right" | "left";
export type NoteCategory = "technical" | "tactical" | "physical" | "mental";
export type ExerciseCategory =
  | "warm_up"
  | "technical"
  | "tactical"
  | "physical"
  | "points"
  | "cool_down";
export type BlockType =
  | "warm_up"
  | "technical"
  | "physical"
  | "tactical"
  | "points"
  | "cool_down";

export type Group = {
  id: string;
  name: string;
  day_of_week: number; // 1 = Mon ... 7 = Sun
  start_time: string; // "HH:MM:SS"
  end_time: string;
  location: string;
  ball_type: BallType | null;
  level: string | null;
  age_band: string | null;
  active_from: string | null;
  active_until: string | null;
  notes: string | null;
  created_at: string;
};

export type Player = {
  id: string;
  first_name: string;
  last_name: string | null;
  year_of_birth: number | null;
  primary_group_id: string | null;
  dominant_hand: Hand | null;
  level: string | null;
  parent_contact: string | null;
  notes: string | null;
  created_at: string;
};

export type PlayerNote = {
  id: string;
  player_id: string;
  category: NoteCategory;
  content: string;
  created_at: string;
};

export type Exercise = {
  id: string;
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
  created_at: string;
};

export type TrainingPlan = {
  id: string;
  group_id: string;
  week_of: string; // "YYYY-MM-DD"
  notes: string | null;
  created_at: string;
};

export type PlanBlock = {
  id: string;
  plan_id: string;
  order_index: number;
  block_type: BlockType;
  exercise_id: string | null;
  duration_minutes: number | null;
  notes: string | null;
};
