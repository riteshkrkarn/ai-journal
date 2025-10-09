import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

/**
 * Create a new goal
 */
export async function createGoal(
  userId: string,
  title: string,
  description: string,
  deadline: string
): Promise<{ id: string; title: string }> {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title,
      description,
      deadline,
      completed: false,
    })
    .select("id, title")
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return data;
}

/**
 * Get all goals for a user
 */
export async function getAllGoals(userId: string): Promise<
  Array<{
    id: string;
    title: string;
    description: string;
    deadline: string;
    completed: boolean;
    created_at: string;
  }>
> {
  const { data, error } = await supabase
    .from("goals")
    .select("id, title, description, deadline, completed, created_at")
    .eq("user_id", userId)
    .order("deadline", { ascending: true });

  if (error) {
    throw new Error(`Failed to get goals: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single goal by ID
 */
export async function getGoalById(
  userId: string,
  goalId: string
): Promise<{
  id: string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
} | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("id, title, description, deadline, completed")
    .eq("user_id", userId)
    .eq("id", goalId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get goal: ${error.message}`);
  }

  return data;
}

/**
 * Update goal completion status
 */
export async function updateGoalStatus(
  userId: string,
  goalId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ completed })
    .eq("user_id", userId)
    .eq("id", goalId);

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(
  userId: string,
  goalId: string
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("user_id", userId)
    .eq("id", goalId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}
