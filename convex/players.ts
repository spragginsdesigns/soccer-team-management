import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyTeamAccess, verifyTeamModifyAccess, getAuthenticatedUser } from "./lib/access";

// Get all players for a team (must be team member)
export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) return [];

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

// Get a single player with their assessments (must be team member)
export const getById = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Verify team membership
    const access = await verifyTeamAccess(ctx, player.teamId);
    if (!access) return null;

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

// Create a new player (must be owner or coach)
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    age: v.optional(v.string()), // Legacy support
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await verifyTeamModifyAccess(ctx, args.teamId);
    if (!access) {
      throw new Error("Not authenticated or access denied");
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

// Update player info (must be owner or coach)
export const update = mutation({
  args: {
    id: v.id("players"),
    name: v.optional(v.string()),
    age: v.optional(v.string()), // Legacy support
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.id);
    if (!player) {
      throw new Error("Player not found");
    }

    // Verify team modify access
    const access = await verifyTeamModifyAccess(ctx, player.teamId);
    if (!access) {
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

// Delete a player and all their assessments (must be owner or coach)
export const remove = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.id);
    if (!player) {
      throw new Error("Player not found");
    }

    // Verify team modify access
    const access = await verifyTeamModifyAccess(ctx, player.teamId);
    if (!access) {
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

// Get player info for a linked user (players viewing their own profile)
export const getLinkedPlayerInfo = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) return null;

    // Get user profile to check linked players
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    // Check if this player is linked to the user
    const linkedPlayerIds = profile.linkedPlayerIds || [];
    const isLinked = linkedPlayerIds.some(
      (id) => id.toString() === args.playerId.toString()
    );

    if (!isLinked) return null;

    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Get the team info
    const team = await ctx.db.get(player.teamId);

    // Get assessments
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    assessments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      ...player,
      team: team ? { _id: team._id, name: team.name } : null,
      assessments,
    };
  },
});

// Get all linked player info for the current user
export const getMyLinkedPlayers = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) return [];

    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || !profile.linkedPlayerIds?.length) return [];

    // Get all linked players with their team and assessment info
    const players = await Promise.all(
      profile.linkedPlayerIds.map(async (playerId) => {
        const player = await ctx.db.get(playerId);
        if (!player) return null;

        const team = await ctx.db.get(player.teamId);

        const assessments = await ctx.db
          .query("assessments")
          .withIndex("by_player", (q) => q.eq("playerId", playerId))
          .collect();

        assessments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return {
          ...player,
          team: team ? { _id: team._id, name: team.name } : null,
          assessments,
          latestRating: assessments[0]?.overallRating ?? null,
        };
      })
    );

    return players.filter(Boolean);
  },
});
