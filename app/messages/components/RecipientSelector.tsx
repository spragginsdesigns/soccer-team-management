"use client";

import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, User } from "lucide-react";

interface Member {
  userId: Id<"users">;
  name: string;
  email: string;
  role: "owner" | "coach" | "viewer";
}

interface RecipientSelectorProps {
  members: Member[];
  selectedUserId: Id<"users"> | null;
  onSelect: (userId: Id<"users"> | null) => void;
}

export function RecipientSelector({
  members,
  selectedUserId,
  onSelect,
}: RecipientSelectorProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No team members available
      </div>
    );
  }

  return (
    <div className="border border-input rounded-lg max-h-48 overflow-y-auto">
      {members.map((member) => {
        const isSelected = member.userId === selectedUserId;
        return (
          <button
            key={member.userId}
            type="button"
            onClick={() => onSelect(isSelected ? null : member.userId)}
            className={cn(
              "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
              isSelected && "bg-muted"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{member.name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    member.role === "owner" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                    member.role === "coach" && "bg-primary/10 text-primary border-primary/20",
                    member.role === "viewer" && "bg-muted text-muted-foreground"
                  )}
                >
                  {member.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            {isSelected && (
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
