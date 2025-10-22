import { supabaseAdmin } from "./supabase";

/**
 * Generate a unique 6-character alphanumeric invite code
 */
async function generateInviteCode(): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code: string;
  let isUnique = false;

  // Keep generating until we find a unique code
  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const { data } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("invite_code", code)
      .single();

    if (!data) {
      isUnique = true;
      return code;
    }
  }

  throw new Error("Failed to generate unique invite code");
}

/**
 * Create a new team with a unique invite code
 */
export async function createTeam(
  ownerId: string,
  name: string
): Promise<{ id: string; name: string; invite_code: string }> {
  const inviteCode = await generateInviteCode();

  const { data, error } = await supabaseAdmin
    .from("teams")
    .insert({
      owner_id: ownerId,
      name,
      invite_code: inviteCode,
    })
    .select("id, name, invite_code")
    .single();

  if (error) throw new Error(`Failed to create team: ${error.message}`);
  return data;
}

/**
 * Add member to team with role
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: "lead" | "member" = "member"
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("team_members")
    .insert({ team_id: teamId, user_id: userId, role });

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
  const { data: membersData, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select("user_id, joined_at, role")
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
    .select("id, email, name")
    .in("id", userIds);

  if (usersError)
    throw new Error(`Failed to get user details: ${usersError.message}`);

  // Create a map of user details for quick lookup
  const usersMap = new Map((usersData || []).map((user) => [user.id, user]));

  // Transform the data to include user details
  return membersData.map((member) => {
    const userDetails = usersMap.get(member.user_id);
    return {
      user_id: member.user_id,
      joined_at: member.joined_at,
      role: member.role,
      email: userDetails?.email || null,
      full_name: userDetails?.name || null,
    };
  });
}

/**
 * Get team by invite code
 */
export async function getTeamByInviteCode(inviteCode: string) {
  const { data, error } = await supabaseAdmin
    .from("teams")
    .select("id, name, owner_id")
    .eq("invite_code", inviteCode)
    .single();

  if (error) throw new Error(`Team not found`);
  return data;
}

/**
 * Get team invite code (only if user is the owner/lead)
 */
export async function getTeamInviteCode(
  teamId: string,
  userId: string
): Promise<string> {
  // Get team details
  const { data: teamData, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("owner_id, invite_code")
    .eq("id", teamId)
    .single();

  if (teamError) throw new Error(`Team not found`);

  // Check if user is the owner
  if (teamData.owner_id !== userId) {
    throw new Error(`Only the team lead can view the invite code`);
  }

  return teamData.invite_code;
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
