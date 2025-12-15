import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to verify team ownership
async function verifyTeamOwnership(ctx: any, teamId: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const team = await ctx.db.get(teamId);
  if (!team || team.userId !== userId) return null;

  return { userId, team };
}

// Get a single assessment by ID (must own the team)
export const getById = query({
  args: { id: v.id("assessments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const assessment = await ctx.db.get(args.id);
    if (!assessment) return null;

    // Verify ownership of the team
    const team = await ctx.db.get(assessment.teamId);
    if (!team || team.userId !== userId) return null;

    return assessment;
  },
});

// Get all assessments for a player (must own the team)
export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const player = await ctx.db.get(args.playerId);
    if (!player) return [];

    // Verify ownership of the team
    const team = await ctx.db.get(player.teamId);
    if (!team || team.userId !== userId) return [];

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Sort by date (newest first)
    return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
});

// Get all assessments for a team (must own the team)
export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const ownership = await verifyTeamOwnership(ctx, args.teamId);
    if (!ownership) return [];

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Sort by date (newest first)
    return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
});

// Create a new assessment (must own the team)
export const create = mutation({
  args: {
    playerId: v.id("players"),
    teamId: v.id("teams"),
    date: v.string(),
    evaluator: v.string(),
    ratings: v.any(), // Will match the schema structure
    notes: v.any(), // Will match the schema structure
    overallRating: v.number(),
  },
  handler: async (ctx, args) => {
    const ownership = await verifyTeamOwnership(ctx, args.teamId);
    if (!ownership) {
      throw new Error("Not authenticated or team not found");
    }

    const assessmentId = await ctx.db.insert("assessments", {
      playerId: args.playerId,
      teamId: args.teamId,
      date: args.date,
      evaluator: args.evaluator,
      ratings: args.ratings,
      notes: args.notes,
      overallRating: args.overallRating,
      createdAt: Date.now(),
    });
    return assessmentId;
  },
});

// Update an assessment (must own the team)
export const update = mutation({
  args: {
    id: v.id("assessments"),
    date: v.optional(v.string()),
    evaluator: v.optional(v.string()),
    ratings: v.optional(v.any()),
    notes: v.optional(v.any()),
    overallRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const assessment = await ctx.db.get(args.id);
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Verify ownership of the team
    const team = await ctx.db.get(assessment.teamId);
    if (!team || team.userId !== userId) {
      throw new Error("Access denied");
    }

    const { id, ...updates } = args;
    const updateData: any = {};

    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.evaluator !== undefined) updateData.evaluator = updates.evaluator;
    if (updates.ratings !== undefined) updateData.ratings = updates.ratings;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.overallRating !== undefined) updateData.overallRating = updates.overallRating;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete an assessment (must own the team)
export const remove = mutation({
  args: { id: v.id("assessments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const assessment = await ctx.db.get(args.id);
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Verify ownership of the team
    const team = await ctx.db.get(assessment.teamId);
    if (!team || team.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.id);
  },
});
