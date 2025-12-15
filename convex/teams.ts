import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all teams for the current user
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("teams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get a single team by ID (must belong to current user)
export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team || team.userId !== userId) return null;

    return team;
  },
});

// Get a team by team code (legacy support, but now requires auth)
export const getByTeamCode = query({
  args: { teamCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db
      .query("teams")
      .withIndex("by_team_code", (q) => q.eq("teamCode", args.teamCode))
      .first();

    // Only return if user owns this team
    if (!team || team.userId !== userId) return null;

    return team;
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

    // Generate a unique team code based on name and timestamp
    const teamCode = `${args.name.toUpperCase().replace(/\s+/g, "").slice(0, 8)}-${now.toString(36).slice(-4).toUpperCase()}`;

    const teamId = await ctx.db.insert("teams", {
      teamCode,
      name: args.name,
      evaluator: args.evaluator || "",
      userId,
      createdAt: now,
      updatedAt: now,
    });

    return teamId;
  },
});

// Update team info (must belong to current user)
export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.string(),
    evaluator: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get(args.id);
    if (!team || team.userId !== userId) {
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

// Delete a team and all associated players and assessments
export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get(args.id);
    if (!team || team.userId !== userId) {
      throw new Error("Team not found or access denied");
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
