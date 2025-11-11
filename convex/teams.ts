import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all teams (for future multi-team support)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teams").collect();
  },
});

// Get a single team by ID
export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

// Create a new team
export const create = mutation({
  args: {
    name: v.string(),
    evaluator: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      evaluator: args.evaluator,
      createdAt: now,
      updatedAt: now,
    });
    return teamId;
  },
});

// Update team info
export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.string(),
    evaluator: v.string(),
  },
  handler: async (ctx, args) => {
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
