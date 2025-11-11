import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teams: defineTable({
    teamCode: v.string(), // Unique code to identify this team (e.g., "Eagles2025")
    name: v.string(),
    evaluator: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.optional(v.string()), // For future auth integration
  })
    .index("by_user", ["userId"])
    .index("by_team_code", ["teamCode"]),

  players: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
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
