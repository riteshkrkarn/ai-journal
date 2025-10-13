import { supabaseAdmin } from "./supabase";

/**
 * Create a new team
 */
export async function createTeam(
  ownerId: string,
  name: string
): Promise<{ id: string; name: string }> {
  const { data, error } = await supabaseAdmin
    .from("teams")
    .insert({
      owner_id: ownerId,
      name,
    })
    .select("id, name")
    .single();

  if (error) throw new Error(`Failed to create team: ${error.message}`);
  return data;
}

/**
 * Add member to team
 */
export async function addTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("team_members")
    .insert({ team_id: teamId, user_id: userId });

  if (error) throw new Error(`Failed to add member: ${error.message}`);
}


/**
 * Get user's teams
 */
export async function getUserTeams(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select(
      `
      team_id,
      teams (
        id,
        name,
        owner_id,
        created_at
      )
    `
    )
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to get teams: ${error.message}`);

  // @ts-ignore - Supabase nested query typing
  return (data || []).map((item) => item.teams).filter(Boolean);
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("user_id, joined_at")
    .eq("team_id", teamId);

  if (error) throw new Error(`Failed to get members: ${error.message}`);
  return data || [];
}

/**
 * Check if user is team member
 */
export async function isTeamMember(
  userId: string,
  teamId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  return !!data;
}

/**
 * Leave team
 */
export async function leaveTeam(userId: string, teamId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to leave team: ${error.message}`);
}
