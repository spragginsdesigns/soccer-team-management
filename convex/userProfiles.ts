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
