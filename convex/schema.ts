import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User profiles with app-level roles
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("coach"), v.literal("player"), v.literal("parent")),
    linkedPlayerIds: v.optional(v.array(v.id("players"))),
    phone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Teams with invite codes
  teams: defineTable({
    teamCode: v.string(), // Legacy display code (e.g., "Eagles2025")
    name: v.string(),
    evaluator: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.optional(v.string()), // Original owner (legacy)
    inviteCode: v.optional(v.string()), // Secure invite code (8 chars)
    inviteCodeCreatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_team_code", ["teamCode"])
    .index("by_invite_code", ["inviteCode"]),

  // Team membership for multi-coach access
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("coach"), v.literal("viewer")),
    joinedAt: v.number(),
    invitedBy: v.optional(v.id("users")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  // Rate limiting for join attempts
  joinAttempts: defineTable({
    userId: v.id("users"),
    attemptedAt: v.number(),
    success: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "attemptedAt"]),

  players: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    age: v.optional(v.string()), // Legacy field, use jerseyNumber instead
    jerseyNumber: v.optional(v.string()),
    position: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_team", ["teamId"]),

  assessments: defineTable({
    playerId: v.id("players"),
    teamId: v.id("teams"),
    date: v.string(),
    evaluator: v.string(),
    // Using v.any() for flexibility with dynamic keys containing spaces and special characters
    ratings: v.any(), // Map of skill names to ratings (1-5)
    notes: v.any(), // Map of skill names to notes (strings)
    overallRating: v.number(),
    createdAt: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_team", ["teamId"]),
});
