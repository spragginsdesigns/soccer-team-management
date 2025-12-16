"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { ConversationList } from "./components/ConversationList";
import { ConversationView } from "./components/ConversationView";
import { ComposeDialog } from "./components/ComposeDialog";

export default function MessagesPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // Get user's teams
  const teams = useQuery(api.teams.getAll);

  // Auto-select first team if none selected
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0]._id);
    }
  }, [teams, selectedTeamId]);

  // Loading state
  if (teams === undefined) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // No teams
  if (teams.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <MessageSquare className="h-16 w-16 text-muted-foreground" />
          <div className="text-xl font-semibold text-foreground">No Teams Yet</div>
          <p className="text-muted-foreground text-center max-w-md">
            Join or create a team to start messaging with your teammates.
          </p>
          <Button onClick={() => window.location.href = "/teams"}>
            Go to Teams
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Check if we're showing conversation view on mobile
  const isMobileConversationView = selectedConversationId !== null;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header - hidden on mobile when viewing conversation */}
        <div className={`flex items-center justify-between mb-4 ${isMobileConversationView ? "hidden md:flex" : "flex"}`}>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-muted-foreground text-sm">
              Chat with your team members
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Team selector */}
            {teams.length > 1 && (
              <select
                value={selectedTeamId ?? ""}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value as Id<"teams">);
                  setSelectedConversationId(null);
                }}
                className="bg-background border border-input rounded-md px-3 py-2 text-sm"
              >
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Conversation list - hidden on mobile when viewing conversation */}
          <Card className={`md:w-80 flex-shrink-0 overflow-hidden ${isMobileConversationView ? "hidden md:block" : "w-full md:w-80"}`}>
            <CardContent className="p-0 h-full">
              {selectedTeamId && (
                <ConversationList
                  teamId={selectedTeamId}
                  selectedConversationId={selectedConversationId}
                  onSelectConversation={setSelectedConversationId}
                />
              )}
            </CardContent>
          </Card>

          {/* Conversation view - full width on mobile, shown only when conversation selected */}
          <Card className={`flex-1 overflow-hidden ${isMobileConversationView ? "block" : "hidden md:block"}`}>
            <CardContent className="p-0 h-full">
              {selectedConversationId ? (
                <ConversationView
                  conversationId={selectedConversationId}
                  onBack={() => setSelectedConversationId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <p>Select a conversation to view messages</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compose dialog */}
      {selectedTeamId && (
        <ComposeDialog
          teamId={selectedTeamId}
          open={composeOpen}
          onOpenChange={setComposeOpen}
          onConversationCreated={(convId) => {
            setSelectedConversationId(convId);
            setComposeOpen(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}
