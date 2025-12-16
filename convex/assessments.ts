import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyTeamModifyAccess } from "./lib/access";

// Get a single assessment by ID (coaches only)
export const getById = query({
  args: { id: v.id("assessments") },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.id);
    if (!assessment) return null;

    // Verify user has coach access to the team
    const access = await verifyTeamModifyAccess(ctx, assessment.teamId);
    if (!access) return null;

    return assessment;
  },
});

// Get all assessments for a player (coaches only)
export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return [];

    // Verify user has coach access to the team
    const access = await verifyTeamModifyAccess(ctx, player.teamId);
    if (!access) return [];

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Sort by date (newest first)
    return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
});

// Get all assessments for a team (coaches only)
export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Verify user has coach access to the team
    const access = await verifyTeamModifyAccess(ctx, args.teamId);
    if (!access) return [];

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Sort by date (newest first)
    return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
});

// Create a new assessment (coaches only)
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
    // Verify user has coach access to the team
    const access = await verifyTeamModifyAccess(ctx, args.teamId);
    if (!access) {
      throw new Error("Access denied: coaches only");
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

// Update an assessment (coaches only)
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
    const assessment = await ctx.db.get(args.id);
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Verify user has coach access to the team
    const access = await verifyTeamModifyAccess(ctx, assessment.teamId);
    if (!access) {
      throw new Error("Access denied: coaches only");
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

// Delete an assessment (coaches only)
export const remove = mutation({
  args: { id: v.id("assessments") },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.id);
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Verify user has coach access to the team
    const access = await verifyTeamModifyAccess(ctx, assessment.teamId);
    if (!access) {
      throw new Error("Access denied: coaches only");
    }

    await ctx.db.delete(args.id);
  },
});
