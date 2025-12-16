import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current user's profile (including role)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

// Check if user has completed onboarding (has a profile with role)
export const hasCompletedOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile !== null;
  },
});

// Create user profile with role (called during onboarding)
export const create = mutation({
  args: {
    role: v.union(v.literal("coach"), v.literal("player"), v.literal("parent")),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Profile already exists");
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      phone: args.phone,
      linkedPlayerIds: [],
      createdAt: now,
      updatedAt: now,
    });

    return profileId;
  },
});

// Update user profile
export const update = mutation({
  args: {
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      phone: args.phone,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update user role
export const updateRole = mutation({
  args: {
    role: v.union(v.literal("coach"), v.literal("player"), v.literal("parent")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Link a player to a parent/player account
export const linkPlayer = mutation({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.role === "coach") {
      throw new Error("Coaches cannot link players to their profile");
    }

    // Verify player exists
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const currentLinks = profile.linkedPlayerIds || [];
    if (currentLinks.includes(args.playerId)) {
      throw new Error("Player already linked");
    }

    await ctx.db.patch(profile._id, {
      linkedPlayerIds: [...currentLinks, args.playerId],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Unlink a player from a parent/player account
export const unlinkPlayer = mutation({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const currentLinks = profile.linkedPlayerIds || [];
    const newLinks = currentLinks.filter((id) => id !== args.playerId);

    await ctx.db.patch(profile._id, {
      linkedPlayerIds: newLinks,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Export all user data (for data portability)
export const exportAllData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get user's team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get teams the user owns or is a member of
    const teams = await Promise.all(
      memberships.map(async (m) => {
        const team = await ctx.db.get(m.teamId);
        if (!team) return null;

        // Only include full team data if user is owner
        if (m.role === "owner") {
          // Get players for this team
          const players = await ctx.db
            .query("players")
            .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
            .collect();

          // Get assessments for this team
          const assessments = await ctx.db
            .query("assessments")
            .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
            .collect();

          return {
            team: {
              name: team.name,
              teamCode: team.teamCode,
              evaluator: team.evaluator,
              createdAt: team.createdAt,
            },
            role: m.role,
            players: players.map((p) => ({
              name: p.name,
              jerseyNumber: p.jerseyNumber,
              position: p.position,
              createdAt: p.createdAt,
            })),
            assessments: assessments.map((a) => ({
              date: a.date,
              evaluator: a.evaluator,
              ratings: a.ratings,
              notes: a.notes,
              overallRating: a.overallRating,
              createdAt: a.createdAt,
            })),
          };
        }

        // For non-owners, just include basic membership info
        return {
          team: {
            name: team.name,
            teamCode: team.teamCode,
          },
          role: m.role,
        };
      })
    );

    return {
      exportDate: new Date().toISOString(),
      profile: profile
        ? {
            role: profile.role,
            phone: profile.phone,
            createdAt: profile.createdAt,
          }
        : null,
      teams: teams.filter((t) => t !== null),
    };
  },
});

// Delete user account and all associated data
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get all team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Delete teams the user owns (along with all team data)
    for (const membership of memberships) {
      if (membership.role === "owner") {
        const teamId = membership.teamId;

        // Delete all team memberships for this team
        const teamMemberships = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        for (const tm of teamMemberships) {
          await ctx.db.delete(tm._id);
        }

        // Delete all assessments for this team
        const assessments = await ctx.db
          .query("assessments")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        for (const assessment of assessments) {
          await ctx.db.delete(assessment._id);
        }

        // Delete all players for this team
        const players = await ctx.db
          .query("players")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();

        for (const player of players) {
          await ctx.db.delete(player._id);
        }

        // Delete the team itself
        await ctx.db.delete(teamId);
      } else {
        // Just remove the user's membership from teams they don't own
        await ctx.db.delete(membership._id);
      }
    }

    // Delete join attempts
    const joinAttempts = await ctx.db
      .query("joinAttempts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const attempt of joinAttempts) {
      await ctx.db.delete(attempt._id);
    }

    // Delete user profile
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    return { success: true };
  },
});
