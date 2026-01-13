import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { verifyTeamAccess, verifyTeamModifyAccess } from "./lib/access";

// Get all events for a team (sorted by start time)
export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) {
      return [];
    }

    const events = await ctx.db
      .query("scheduleEvents")
      .withIndex("by_team_and_start", (q) => q.eq("teamId", args.teamId))
      .collect();

    return events;
  },
});

// Get upcoming events for a team (from now onwards)
export const getUpcoming = query({
  args: { teamId: v.id("teams"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) {
      return [];
    }

    const now = Date.now();
    const events = await ctx.db
      .query("scheduleEvents")
      .withIndex("by_team_and_start", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.gte(q.field("startTime"), now))
      .take(args.limit ?? 10);

    return events;
  },
});

// Create a new event (coaches/owners only)
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    type: v.union(
      v.literal("practice"),
      v.literal("game"),
      v.literal("meeting"),
      v.literal("other")
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await verifyTeamModifyAccess(ctx, args.teamId);
    if (!access) {
      throw new Error("Not authorized to create events for this team");
    }

    const now = Date.now();
    const eventId = await ctx.db.insert("scheduleEvents", {
      teamId: args.teamId,
      title: args.title,
      type: args.type,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      notes: args.notes,
      createdBy: access.userId,
      createdAt: now,
      updatedAt: now,
    });

    return eventId;
  },
});

// Update an event (coaches/owners only)
export const update = mutation({
  args: {
    eventId: v.id("scheduleEvents"),
    title: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("practice"),
        v.literal("game"),
        v.literal("meeting"),
        v.literal("other")
      )
    ),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const access = await verifyTeamModifyAccess(ctx, event.teamId);
    if (!access) {
      throw new Error("Not authorized to update this event");
    }

    const { eventId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(eventId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return eventId;
  },
});

// Delete an event (coaches/owners only)
export const remove = mutation({
  args: { eventId: v.id("scheduleEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const access = await verifyTeamModifyAccess(ctx, event.teamId);
    if (!access) {
      throw new Error("Not authorized to delete this event");
    }

    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});
