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

// Get all players for a team (must own the team)
export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const ownership = await verifyTeamOwnership(ctx, args.teamId);
    if (!ownership) return [];

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

// Get a single player with their assessments (must own the team)
export const getById = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Verify ownership of the team
    const team = await ctx.db.get(player.teamId);
    if (!team || team.userId !== userId) return null;

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

// Create a new player (must own the team)
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    age: v.optional(v.string()), // Legacy support
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownership = await verifyTeamOwnership(ctx, args.teamId);
    if (!ownership) {
      throw new Error("Not authenticated or team not found");
    }

    const now = Date.now();
    const playerData: any = {
      teamId: args.teamId,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    };

    // Only set optional fields if they're provided
    if (args.age !== undefined) playerData.age = args.age;
    if (args.jerseyNumber !== undefined) playerData.jerseyNumber = args.jerseyNumber;
    if (args.position !== undefined) playerData.position = args.position;

    const playerId = await ctx.db.insert("players", playerData);
    return playerId;
  },
});

// Update player info (must own the team)
export const update = mutation({
  args: {
    id: v.id("players"),
    name: v.optional(v.string()),
    age: v.optional(v.string()), // Legacy support
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const player = await ctx.db.get(args.id);
    if (!player) {
      throw new Error("Player not found");
    }

    // Verify ownership of the team
    const team = await ctx.db.get(player.teamId);
    if (!team || team.userId !== userId) {
      throw new Error("Access denied");
    }

    const { id, ...updates } = args;
    const updateData: any = { updatedAt: Date.now() };

    // Only update fields that are explicitly provided
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.jerseyNumber !== undefined) {
      updateData.jerseyNumber = updates.jerseyNumber;
      // Clear legacy age field when updating jerseyNumber
      if (updates.jerseyNumber !== "" && updates.age === undefined) {
        updateData.age = undefined;
      }
    }
    if (updates.position !== undefined) updateData.position = updates.position;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete a player and all their assessments (must own the team)
export const remove = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const player = await ctx.db.get(args.id);
    if (!player) {
      throw new Error("Player not found");
    }

    // Verify ownership of the team
    const team = await ctx.db.get(player.teamId);
    if (!team || team.userId !== userId) {
      throw new Error("Access denied");
    }

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
