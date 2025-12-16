"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Copy, RefreshCw, UserMinus, Crown, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface TeamMembersCardProps {
  teamId: Id<"teams">;
  isOwner: boolean;
}

export function TeamMembersCard({ teamId, isOwner }: TeamMembersCardProps) {
  const [copied, setCopied] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: Id<"teamMembers">;
    name: string;
  } | null>(null);

  const members = useQuery(api.teamMembers.getTeamMembers, { teamId });
  const inviteCode = useQuery(api.teams.getInviteCode, { teamId });
  const generateInviteCode = useMutation(api.teamMembers.generateInviteCode);
  const removeMember = useMutation(api.teamMembers.removeMember);

  const handleCopyCode = async () => {
    if (!inviteCode?.inviteCode) return;

    await navigator.clipboard.writeText(inviteCode.inviteCode);
    setCopied(true);
    toast.success("Invite code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    try {
      const result = await generateInviteCode({ teamId });
      toast.success(`New invite code: ${result.code}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate code");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember({ teamId, memberId: memberToRemove.id });
      toast.success(`${memberToRemove.name} removed from team`);
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case "coach":
        return (
          <Badge variant="secondary">
            Coach
          </Badge>
        );
      case "viewer":
        return (
          <Badge variant="outline">
            Viewer
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (members === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Code Section (Owner Only) */}
          {isOwner && inviteCode?.inviteCode && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Invite Code</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateCode}
                    className="h-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-2xl font-bold tracking-widest text-center py-2">
                {inviteCode.inviteCode}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Share this code with coaches to let them join your team
              </p>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-primary">
                      {member.userName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.userEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role)}
                  {isOwner && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMemberToRemove({
                          id: member._id,
                          name: member.userName,
                        });
                        setShowRemoveDialog(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.name} from the team?
              They will lose access to all team data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
