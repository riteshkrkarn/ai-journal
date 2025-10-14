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
  // First, get the team's owner_id
  const { data: teamData, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (teamError) throw new Error(`Failed to get team: ${teamError.message}`);

  const ownerId = teamData?.owner_id;

  // Get all team members
  const { data: membersData, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select("user_id, joined_at")
    .eq("team_id", teamId);

  if (membersError)
    throw new Error(`Failed to get members: ${membersError.message}`);

  if (!membersData || membersData.length === 0) {
    return [];
  }

  // Get user details for all members
  const userIds = membersData.map((m) => m.user_id);
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);

  if (usersError)
    throw new Error(`Failed to get user details: ${usersError.message}`);

  // Create a map of user details for quick lookup
  const usersMap = new Map((usersData || []).map((user) => [user.id, user]));

  // Transform the data to include user details and determine roles
  return membersData.map((member) => {
    const userDetails = usersMap.get(member.user_id);
    return {
      user_id: member.user_id,
      joined_at: member.joined_at,
      role: member.user_id === ownerId ? "owner" : "member",
      email: userDetails?.email || null,
      full_name: userDetails?.full_name || null,
    };
  });
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
