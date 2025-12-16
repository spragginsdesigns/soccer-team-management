import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export type TeamMemberRole = "owner" | "coach" | "viewer";
export type UserRole = "coach" | "player" | "parent";

// Generate a secure 8-character invite code
export function generateSecureCode(): string {
  // Exclude confusing characters: O/0, I/1
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const length = 8;
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Verify user is authenticated and get their ID
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

// Get user's profile with role
export async function getUserProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  return profile ? { ...profile, userId } : null;
}

// Verify user has a specific app-level role
export async function verifyUserRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: UserRole[]
): Promise<{ userId: Id<"users">; role: UserRole } | null> {
  const profile = await getUserProfile(ctx);
  if (!profile) {
    return null;
  }

  if (!allowedRoles.includes(profile.role)) {
    return null;
  }

  return { userId: profile.userId, role: profile.role };
}

// Check if user has access to a team (either as owner or member)
export async function verifyTeamAccess(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
): Promise<{ userId: Id<"users">; role: TeamMemberRole; team: any } | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const team = await ctx.db.get(teamId);
  if (!team) {
    return null;
  }

  // Check team membership first
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId)
    )
    .first();

  if (membership) {
    return { userId, role: membership.role, team };
  }

  // Fallback: Check legacy userId field for backward compatibility
  if (team.userId === userId.toString()) {
    return { userId, role: "owner", team };
  }

  return null;
}

// Check if user can modify team (owner or coach role)
export async function verifyTeamModifyAccess(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
): Promise<{ userId: Id<"users">; role: TeamMemberRole; team: any } | null> {
  const access = await verifyTeamAccess(ctx, teamId);
  if (!access) {
    return null;
  }

  // Only owner and coach can modify
  if (access.role === "viewer") {
    return null;
  }

  return access;
}

// Check if user is team owner
export async function verifyTeamOwner(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
): Promise<{ userId: Id<"users">; team: any } | null> {
  const access = await verifyTeamAccess(ctx, teamId);
  if (!access || access.role !== "owner") {
    return null;
  }

  return { userId: access.userId, team: access.team };
}

// Rate limiting check for join attempts
export async function checkJoinRateLimit(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<{ allowed: boolean; message?: string }> {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  const recentAttempts = await ctx.db
    .query("joinAttempts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.gte(q.field("attemptedAt"), fiveMinutesAgo))
    .collect();

  if (recentAttempts.length >= 5) {
    return {
      allowed: false,
      message: "Too many attempts. Please wait 5 minutes.",
    };
  }

  return { allowed: true };
}

// Log a join attempt
export async function logJoinAttempt(
  ctx: MutationCtx,
  userId: Id<"users">,
  success: boolean
) {
  await ctx.db.insert("joinAttempts", {
    userId,
    attemptedAt: Date.now(),
    success,
  });
}
