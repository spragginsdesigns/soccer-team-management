"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Megaphone, User, Loader2 } from "lucide-react";

interface ConversationListProps {
  teamId: Id<"teams">;
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
}

export function ConversationList({
  teamId,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const conversations = useQuery(api.messages.getTeamConversations, { teamId });

  if (conversations === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <User className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a new message to begin
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Conversations</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const isSelected = conv._id === selectedConversationId;
          const displayName =
            conv.type === "announcement"
              ? conv.title || "Team Announcement"
              : conv.participants
                  .map((p) => p?.name)
                  .filter(Boolean)
                  .join(", ") || "Unknown";

          return (
            <button
              key={conv._id}
              onClick={() => onSelectConversation(conv._id)}
              className={cn(
                "w-full p-3 text-left border-b border-border hover:bg-muted/50 transition-colors",
                isSelected && "bg-muted"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                    conv.type === "announcement"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {conv.type === "announcement" ? (
                    <Megaphone className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm truncate",
                        conv.hasUnread && "text-foreground"
                      )}
                    >
                      {displayName}
                    </span>
                    {conv.hasUnread && (
                      <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                    )}
                  </div>
                  {conv.lastMessage && (
                    <>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage.senderName}: {conv.lastMessage.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(conv.lastMessage.createdAt)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
