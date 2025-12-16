import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  generateSecureCode,
  verifyTeamAccess,
  verifyTeamOwner,
  checkJoinRateLimit,
  logJoinAttempt,
} from "./lib/access";

// Get current user's membership for a specific team
export const getMembership = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    return membership;
  },
});

// Get all members of a team
export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) {
      return [];
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Enrich with user info
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "",
        };
      })
    );

    return enrichedMembers;
  },
});

// Get teams where user is owner OR member
export const getMyTeams = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get team details for each membership
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;
        return {
          ...team,
          memberRole: membership.role,
        };
      })
    );

    return teams.filter((t) => t !== null);
  },
});

// Generate a new invite code for a team (owner only)
export const generateInviteCode = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const owner = await verifyTeamOwner(ctx, args.teamId);
    if (!owner) {
      throw new Error("Only team owners can generate invite codes");
    }

    // Generate unique code
    let code = generateSecureCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", code))
        .first();

      if (!existing) break;
      code = generateSecureCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique code. Please try again.");
    }

    await ctx.db.patch(args.teamId, {
      inviteCode: code,
      inviteCodeCreatedAt: Date.now(),
    });

    return { code };
  },
});

// Join a team using invite code
export const joinTeam = mutation({
  args: {
    inviteCode: v.string(),
    role: v.optional(
      v.union(v.literal("coach"), v.literal("viewer"))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateCheck = await checkJoinRateLimit(ctx, userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message);
    }

    // Find team by invite code
    const team = await ctx.db
      .query("teams")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase().trim())
      )
      .first();

    if (!team) {
      await logJoinAttempt(ctx, userId, false);
      throw new Error("Invalid invite code");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", team._id).eq("userId", userId)
      )
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of this team");
    }

    // Add as member
    await ctx.db.insert("teamMembers", {
      teamId: team._id,
      userId,
      role: args.role ?? "coach",
      joinedAt: Date.now(),
    });

    await logJoinAttempt(ctx, userId, true);

    return { teamId: team._id, teamName: team.name };
  },
});

// Remove a member from team (owner only)
export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const owner = await verifyTeamOwner(ctx, args.teamId);
    if (!owner) {
      throw new Error("Only team owners can remove members");
    }

    const membership = await ctx.db.get(args.memberId);
    if (!membership || membership.teamId !== args.teamId) {
      throw new Error("Member not found");
    }

    // Can't remove self as owner
    if (membership.role === "owner") {
      throw new Error("Cannot remove the team owner");
    }

    await ctx.db.delete(args.memberId);
    return { success: true };
  },
});

// Update member role (owner only)
export const updateMemberRole = mutation({
  args: {
    memberId: v.id("teamMembers"),
    role: v.union(v.literal("coach"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.memberId);
    if (!membership) {
      throw new Error("Member not found");
    }

    const owner = await verifyTeamOwner(ctx, membership.teamId);
    if (!owner) {
      throw new Error("Only team owners can update roles");
    }

    // Can't change owner role
    if (membership.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    await ctx.db.patch(args.memberId, { role: args.role });
    return { success: true };
  },
});

// Leave a team voluntarily
export const leaveTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Owner can't leave (must transfer or delete team)
    if (membership.role === "owner") {
      throw new Error("Team owners cannot leave. Transfer ownership or delete the team.");
    }

    await ctx.db.delete(membership._id);
    return { success: true };
  },
});
