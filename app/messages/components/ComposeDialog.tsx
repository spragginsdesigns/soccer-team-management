"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Megaphone, User } from "lucide-react";
import { toast } from "sonner";
import { RecipientSelector } from "./RecipientSelector";

interface ComposeDialogProps {
  teamId: Id<"teams">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: Id<"conversations">) => void;
}

export function ComposeDialog({
  teamId,
  open,
  onOpenChange,
  onConversationCreated,
}: ComposeDialogProps) {
  const [type, setType] = useState<"direct" | "announcement">("direct");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const members = useQuery(api.messages.getTeamMembersForMessaging, { teamId });
  const createConversation = useMutation(api.messages.createConversation);

  // Check if current user can create announcements (coach/owner)
  const currentUserMembership = useQuery(api.teamMembers.getMembership, { teamId });
  const canCreateAnnouncement =
    currentUserMembership?.role === "owner" ||
    currentUserMembership?.role === "coach";

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (type === "direct" && !selectedUserId) {
      toast.error("Please select a recipient");
      return;
    }

    setIsSending(true);
    try {
      const conversationId = await createConversation({
        teamId,
        type,
        participantIds: type === "direct" && selectedUserId ? [selectedUserId] : [],
        title: type === "announcement" ? title || undefined : undefined,
        initialMessage: message.trim(),
      });

      toast.success(
        type === "announcement"
          ? "Announcement sent!"
          : "Message sent!"
      );

      // Reset form
      setType("direct");
      setSelectedUserId(null);
      setTitle("");
      setMessage("");

      onConversationCreated(conversationId);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setType("direct");
      setSelectedUserId(null);
      setTitle("");
      setMessage("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Send a direct message or team announcement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message type selector */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as "direct" | "announcement")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Direct Message
                </Label>
              </div>
              {canCreateAnnouncement && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="announcement" id="announcement" />
                  <Label htmlFor="announcement" className="flex items-center gap-2 cursor-pointer">
                    <Megaphone className="h-4 w-4" />
                    Announcement
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Recipient selector (for DMs) */}
          {type === "direct" && (
            <div className="space-y-2">
              <Label>To</Label>
              {members === undefined ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RecipientSelector
                  members={members}
                  selectedUserId={selectedUserId}
                  onSelect={setSelectedUserId}
                />
              )}
            </div>
          )}

          {/* Title (for announcements) */}
          {type === "announcement" && (
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g., Practice Schedule Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSending}
              />
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              disabled={isSending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
