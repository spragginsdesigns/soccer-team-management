"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface JoinTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (teamId: string, teamName: string) => void;
}

export function JoinTeamDialog({ open, onOpenChange, onSuccess }: JoinTeamDialogProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const joinTeam = useMutation(api.teamMembers.joinTeam);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinTeam({ inviteCode: inviteCode.trim() });
      toast.success(`Successfully joined ${result.teamName}!`);
      setInviteCode("");
      onOpenChange(false);
      onSuccess?.(result.teamId, result.teamName);
    } catch (error: any) {
      toast.error(error.message || "Failed to join team");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isJoining) {
      handleJoin();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Join a Team
          </DialogTitle>
          <DialogDescription>
            Enter the invite code shared by a team owner to join their team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="e.g., ABCD1234"
              className="h-12 text-center font-mono text-lg tracking-widest"
              maxLength={8}
              autoFocus
              disabled={isJoining}
            />
            <p className="text-xs text-muted-foreground">
              Invite codes are 8 characters long
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isJoining}
          >
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isJoining || !inviteCode.trim()}>
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Team"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
