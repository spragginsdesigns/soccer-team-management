"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2, Megaphone, User } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface ConversationViewProps {
  conversationId: Id<"conversations">;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useQuery(api.messages.getConversation, { conversationId });
  const messages = useQuery(api.messages.getConversationMessages, { conversationId });
  const markAsRead = useMutation(api.messages.markAsRead);
  const sendMessage = useMutation(api.messages.sendMessage);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead({ conversationId }).catch(() => {
        // Ignore errors
      });
    }
  }, [conversationId, markAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (conversation === undefined || messages === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Conversation not found
      </div>
    );
  }

  const displayName =
    conversation.type === "announcement"
      ? conversation.title || "Team Announcement"
      : conversation.participants
          .map((p) => p?.name)
          .filter(Boolean)
          .join(", ") || "Unknown";

  const handleSend = async (content: string) => {
    await sendMessage({ conversationId, content });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            conversation.type === "announcement"
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {conversation.type === "announcement" ? (
            <Megaphone className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">{displayName}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.type === "announcement"
              ? "Team announcement"
              : "Direct message"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              conversationId={conversationId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
