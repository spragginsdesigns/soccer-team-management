import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getAuthenticatedUser,
  verifyTeamAccess,
  verifyTeamModifyAccess,
} from "./lib/access";

// Get all conversations for a team (sorted by most recent)
export const getTeamConversations = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) return [];

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Enrich with participant info and last message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get participant names for DMs
        const participants = await Promise.all(
          conv.participantIds.map(async (userId) => {
            const user = await ctx.db.get(userId);
            return user ? { id: userId, name: user.name ?? "Unknown" } : null;
          })
        );

        // Get last message
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();

        // Get sender info for last message
        let lastMessageSender = null;
        if (lastMessage) {
          const sender = await ctx.db.get(lastMessage.senderId);
          lastMessageSender = sender?.name ?? "Unknown";
        }

        // Get unread status for current user
        const readReceipt = await ctx.db
          .query("messageReads")
          .withIndex("by_conversation_and_user", (q) =>
            q.eq("conversationId", conv._id).eq("userId", access.userId)
          )
          .first();

        const hasUnread = lastMessage
          ? !readReceipt || readReceipt.lastReadAt < lastMessage.createdAt
          : false;

        return {
          ...conv,
          participants: participants.filter(Boolean),
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderName: lastMessageSender,
                createdAt: lastMessage.createdAt,
              }
            : null,
          hasUnread,
        };
      })
    );

    // Sort by lastMessageAt descending
    return enrichedConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Get messages for a specific conversation
export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    // Verify team access
    const access = await verifyTeamAccess(ctx, conversation.teamId);
    if (!access) return [];

    // For DMs, verify user is a participant
    if (
      conversation.type === "direct" &&
      !conversation.participantIds.some((id) => id === userId)
    ) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Enrich with sender info
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name ?? "Unknown",
          isOwn: msg.senderId === userId,
        };
      })
    );

    // Sort by createdAt ascending (oldest first)
    return enrichedMessages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get total unread count for current user across all teams
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) return 0;

    // Get all teams user is a member of
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let unreadCount = 0;

    for (const membership of memberships) {
      // Get all conversations in this team
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect();

      for (const conv of conversations) {
        // Skip DMs where user is not a participant
        if (conv.type === "direct" && !conv.participantIds.some((id) => id === userId)) {
          continue;
        }

        // Get last message
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();

        if (!lastMessage) continue;

        // Check read receipt
        const readReceipt = await ctx.db
          .query("messageReads")
          .withIndex("by_conversation_and_user", (q) =>
            q.eq("conversationId", conv._id).eq("userId", userId)
          )
          .first();

        if (!readReceipt || readReceipt.lastReadAt < lastMessage.createdAt) {
          unreadCount++;
        }
      }
    }

    return unreadCount;
  },
});

// Get team members for recipient selector
export const getTeamMembersForMessaging = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) return [];

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          userId: member.userId,
          name: user?.name ?? "Unknown",
          email: user?.email ?? "",
          role: member.role,
          isCurrentUser: String(member.userId) === String(access.userId),
        };
      })
    );

    // Filter out current user and sort by name
    return enrichedMembers
      .filter((m) => !m.isCurrentUser)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Create a new conversation (DM or announcement)
export const createConversation = mutation({
  args: {
    teamId: v.id("teams"),
    type: v.union(v.literal("announcement"), v.literal("direct")),
    participantIds: v.array(v.id("users")),
    title: v.optional(v.string()),
    initialMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await verifyTeamAccess(ctx, args.teamId);
    if (!access) {
      throw new Error("Not authorized to access this team");
    }

    // Only coaches/owners can create announcements
    if (args.type === "announcement") {
      const modifyAccess = await verifyTeamModifyAccess(ctx, args.teamId);
      if (!modifyAccess) {
        throw new Error("Only coaches can create announcements");
      }
    }

    // For DMs, check if conversation already exists
    if (args.type === "direct" && args.participantIds.length === 1) {
      const otherUserId = args.participantIds[0];
      const participants = [access.userId, otherUserId].sort();

      // Look for existing conversation
      const existingConversations = await ctx.db
        .query("conversations")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .filter((q) => q.eq(q.field("type"), "direct"))
        .collect();

      for (const conv of existingConversations) {
        const sortedParticipants = [...conv.participantIds].sort();
        if (
          sortedParticipants.length === 2 &&
          sortedParticipants[0] === participants[0] &&
          sortedParticipants[1] === participants[1]
        ) {
          // Add message to existing conversation
          await ctx.db.insert("messages", {
            conversationId: conv._id,
            teamId: args.teamId,
            senderId: access.userId,
            content: args.initialMessage,
            createdAt: Date.now(),
          });

          // Update lastMessageAt
          await ctx.db.patch(conv._id, { lastMessageAt: Date.now() });

          return conv._id;
        }
      }
    }

    const now = Date.now();

    // Create conversation
    const participantIds =
      args.type === "direct"
        ? [access.userId, ...args.participantIds]
        : []; // Announcements are for all team members

    const conversationId = await ctx.db.insert("conversations", {
      teamId: args.teamId,
      type: args.type,
      participantIds,
      title: args.title,
      lastMessageAt: now,
      createdAt: now,
    });

    // Create initial message
    await ctx.db.insert("messages", {
      conversationId,
      teamId: args.teamId,
      senderId: access.userId,
      content: args.initialMessage,
      createdAt: now,
    });

    return conversationId;
  },
});

// Send a message to an existing conversation
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify team access
    const access = await verifyTeamAccess(ctx, conversation.teamId);
    if (!access) {
      throw new Error("Not authorized to access this team");
    }

    // For DMs, verify user is a participant
    if (
      conversation.type === "direct" &&
      !conversation.participantIds.some((id) => id === userId)
    ) {
      throw new Error("Not a participant in this conversation");
    }

    const now = Date.now();

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      teamId: conversation.teamId,
      senderId: userId,
      content: args.content,
      createdAt: now,
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, { lastMessageAt: now });

    return messageId;
  },
});

// Mark conversation as read
export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify team access
    const access = await verifyTeamAccess(ctx, conversation.teamId);
    if (!access) {
      throw new Error("Not authorized");
    }

    const now = Date.now();

    // Check for existing read receipt
    const existing = await ctx.db
      .query("messageReads")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadAt: now });
    } else {
      await ctx.db.insert("messageReads", {
        conversationId: args.conversationId,
        userId,
        lastReadAt: now,
      });
    }
  },
});

// Edit a message (only own messages)
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only message owner can edit
    if (message.senderId !== userId) {
      throw new Error("Can only edit your own messages");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });
  },
});

// Delete a message (own messages or team owner can delete any)
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const access = await verifyTeamAccess(ctx, message.teamId);
    if (!access) {
      throw new Error("Not authorized");
    }

    // Can delete own messages, or owner can delete any
    if (message.senderId !== userId && access.role !== "owner") {
      throw new Error("Can only delete your own messages");
    }

    await ctx.db.delete(args.messageId);
  },
});

// Get a single conversation by ID
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Verify team access
    const access = await verifyTeamAccess(ctx, conversation.teamId);
    if (!access) return null;

    // For DMs, verify user is a participant
    if (
      conversation.type === "direct" &&
      !conversation.participantIds.some((id) => id === userId)
    ) {
      return null;
    }

    // Enrich with participant info
    const participants = await Promise.all(
      conversation.participantIds.map(async (participantId) => {
        const user = await ctx.db.get(participantId);
        return user ? { id: participantId, name: user.name ?? "Unknown" } : null;
      })
    );

    return {
      ...conversation,
      participants: participants.filter(Boolean),
      currentUserId: userId,
    };
  },
});
