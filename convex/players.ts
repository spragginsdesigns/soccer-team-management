import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all players for a team
export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get assessments for each player
    const playersWithAssessments = await Promise.all(
      players.map(async (player) => {
        const assessments = await ctx.db
          .query("assessments")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        // Sort assessments by date (newest first)
        assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          ...player,
          assessments,
        };
      })
    );

    return playersWithAssessments;
  },
});

// Get a single player with their assessments
export const getById = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Sort assessments by date (newest first)
    assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      ...player,
      assessments,
    };
  },
});

// Create a new player
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    age: v.optional(v.string()), // Legacy support
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const playerId = await ctx.db.insert("players", {
      teamId: args.teamId,
      name: args.name,
      age: args.age || "",
      jerseyNumber: args.jerseyNumber || "",
      position: args.position || "",
      createdAt: now,
      updatedAt: now,
    });
    return playerId;
  },
});

// Update player info
export const update = mutation({
  args: {
    id: v.id("players"),
    name: v.optional(v.string()),
    age: v.optional(v.string()), // Legacy support
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const updateData: any = { updatedAt: Date.now() };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.jerseyNumber !== undefined) updateData.jerseyNumber = updates.jerseyNumber;
    if (updates.position !== undefined) updateData.position = updates.position;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete a player and all their assessments
export const remove = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    // Delete all assessments for this player
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_player", (q) => q.eq("playerId", args.id))
      .collect();

    for (const assessment of assessments) {
      await ctx.db.delete(assessment._id);
    }

    // Delete the player
    await ctx.db.delete(args.id);
  },
});
