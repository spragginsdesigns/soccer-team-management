import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  generateSecureCode,
  verifyTeamAccess,
  verifyTeamModifyAccess,
  verifyTeamOwner,
} from "./lib/access";

// Get all teams for the current user (owned or member)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get teams where user is a member
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memberTeamIds = new Set(memberships.map((m) => m.teamId));

    // Get team details for memberships
    const teamsFromMembership = await Promise.all(
      memberships.map(async (m) => {
        const team = await ctx.db.get(m.teamId);
        return team ? { ...team, memberRole: m.role } : null;
      })
    );

    // Also get legacy teams (where userId matches but no membership record)
    const legacyTeams = await ctx.db
      .query("teams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Merge, avoiding duplicates
    const allTeams = [...teamsFromMembership.filter((t) => t !== null)];

    for (const legacyTeam of legacyTeams) {
      if (!memberTeamIds.has(legacyTeam._id)) {
        allTeams.push({ ...legacyTeam, memberRole: "owner" as const });
      }
    }

    return allTeams;
  },
});

// Get a single team by ID (must be owner or member)
export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) return null;

    return { ...access.team, memberRole: access.role };
  },
});

// Get a team by team code (requires membership)
export const getByTeamCode = query({
  args: { teamCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db
      .query("teams")
      .withIndex("by_team_code", (q) => q.eq("teamCode", args.teamCode))
      .first();

    if (!team) return null;

    // Verify access
    const access = await verifyTeamAccess(ctx, team._id);
    if (!access) return null;

    return { ...team, memberRole: access.role };
  },
});

// Create a new team for the current user
export const create = mutation({
  args: {
    name: v.string(),
    evaluator: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Generate a display team code based on name and timestamp
    const teamCode = `${args.name.toUpperCase().replace(/\s+/g, "").slice(0, 8)}-${now.toString(36).slice(-4).toUpperCase()}`;

    // Generate secure invite code
    let inviteCode = generateSecureCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();

      if (!existing) break;
      inviteCode = generateSecureCode();
      attempts++;
    }

    const teamId = await ctx.db.insert("teams", {
      teamCode,
      name: args.name,
      evaluator: args.evaluator || "",
      userId,
      inviteCode,
      inviteCodeCreatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create owner membership record
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    return teamId;
  },
});

// Update team info (owner or coach role)
export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.string(),
    evaluator: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await verifyTeamModifyAccess(ctx, args.id);
    if (!access) {
      throw new Error("Team not found or access denied");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete a team and all associated data (owner only)
export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const owner = await verifyTeamOwner(ctx, args.id);
    if (!owner) {
      throw new Error("Only team owners can delete teams");
    }

    // Delete all team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete all assessments for this team
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();

    for (const assessment of assessments) {
      await ctx.db.delete(assessment._id);
    }

    // Delete all players for this team
    const players = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();

    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    // Delete the team
    await ctx.db.delete(args.id);
  },
});

// Get team's invite code (owner only)
export const getInviteCode = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) return null;

    // Owner and coaches can see invite code
    if (access.role !== "owner" && access.role !== "coach") return null;

    return {
      inviteCode: access.team.inviteCode,
      createdAt: access.team.inviteCodeCreatedAt,
    };
  },
});
