"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Save, Download, TrendingUp, TrendingDown, Calendar, ChevronLeft, Trash2, Eye, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import { JoinTeamDialog } from "@/components/team/JoinTeamDialog";
import { TeamMembersCard } from "@/components/team/TeamMembersCard";

export default function TeamManager() {
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [teamName, setTeamName] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [showAssessments, setShowAssessments] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showJoinTeam, setShowJoinTeam] = useState(false);

  // Queries
  const currentUser = useQuery(api.users.getCurrentUser);
  const teams = useQuery(api.teams.getAll);
  const selectedTeam = useQuery(
    api.teams.getById,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );
  const players = useQuery(
    api.players.getByTeam,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );

  // Mutations
  const createTeam = useMutation(api.teams.create);
  const updateTeam = useMutation(api.teams.update);
  const deleteTeam = useMutation(api.teams.remove);
  const createPlayer = useMutation(api.players.create);
  const updatePlayer = useMutation(api.players.update);
  const deletePlayer = useMutation(api.players.remove);

  // Sync team details when selected team changes
  useEffect(() => {
    if (selectedTeam) {
      setTeamName(selectedTeam.name);
      setEvaluator(selectedTeam.evaluator);
    }
  }, [selectedTeam]);


  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    try {
      const teamId = await createTeam({ name: newTeamName.trim() });
      setNewTeamName("");
      setShowCreateTeam(false);
      setSelectedTeamId(teamId);
      toast.success("Team created successfully!");
    } catch (error) {
      toast.error("Failed to create team");
    }
  };

  const handleSaveTeamData = async () => {
    if (selectedTeamId) {
      await updateTeam({
        id: selectedTeamId,
        name: teamName,
        evaluator: evaluator,
      });
      toast.success("Team data saved successfully!");
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeamId) return;

    if (confirm("Are you sure you want to delete this team? All players and assessments will be deleted.")) {
      await deleteTeam({ id: selectedTeamId });
      setSelectedTeamId(null);
      toast.success("Team deleted");
    }
  };

  const confirmAddPlayer = async () => {
    if (newPlayerName.trim() && selectedTeamId) {
      await createPlayer({
        teamId: selectedTeamId,
        name: newPlayerName.trim(),
      });
      setNewPlayerName("");
      setShowAddPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId: Id<"players">) => {
    if (confirm("Are you sure you want to delete this player?")) {
      await deletePlayer({ id: playerId });
    }
  };

  const handleUpdatePlayerInfo = async (
    playerId: Id<"players">,
    field: "name" | "jerseyNumber" | "position",
    value: string
  ) => {
    await updatePlayer({
      id: playerId,
      [field]: value,
    });
  };

  const getPlayerLatestRating = (player: any) => {
    if (!player.assessments || player.assessments.length === 0) return "N/A";
    return player.assessments[0].overallRating.toFixed(1);
  };

  const getPlayerProgress = (player: any) => {
    if (!player.assessments || player.assessments.length < 2) return null;
    const latest = parseFloat(player.assessments[0].overallRating);
    const previous = parseFloat(player.assessments[1].overallRating);
    const change = latest - previous;
    return change.toFixed(1);
  };

  const exportData = () => {
    if (!players || players.length === 0) {
      toast.error("No players to export!");
      return;
    }

    const headers = [
      "Player Name",
      "Jersey #",
      "Position",
      "Total Assessments",
      "Latest Rating",
      "Progress",
      "Last Assessment Date",
      "Last Evaluator"
    ];

    const rows = players.map((player) => {
      const progress = getPlayerProgress(player);
      const latestRating = getPlayerLatestRating(player);
      const latestAssessment = player.assessments && player.assessments.length > 0
        ? player.assessments[0]
        : null;

      return [
        player.name || "",
        player.jerseyNumber ?? player.age ?? "",
        player.position || "",
        player.assessments?.length || 0,
        latestRating,
        progress !== null ? (progress > "0" ? "+" : "") + progress : "N/A",
        latestAssessment?.date || "N/A",
        latestAssessment?.evaluator || "N/A"
      ];
    });

    const csvContent = [
      [`Team: ${teamName}`],
      [`Coach: ${evaluator}`],
      [`Export Date: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${teamName || "team"}-roster-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewAssessments = (player: any) => {
    setSelectedPlayer(player);
    setShowAssessments(true);
  };

  // Loading state
  if (teams === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Get first name for welcome message
  const getFirstName = () => {
    if (!currentUser?.name) return null;
    return currentUser.name.split(" ")[0];
  };

  // Team selection view (Dashboard)
  if (!selectedTeamId) {
    const firstName = getFirstName();

    return (
      <div>
        {/* Page Header */}
        <div className="mb-8">
          {firstName ? (
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium">Welcome back, {firstName}!</span>
            </div>
          ) : null}
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your teams and track player development</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Button onClick={() => setShowCreateTeam(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
          <Button variant="outline" onClick={() => setShowJoinTeam(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Join Team
          </Button>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">⚽</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">No teams yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first team to start tracking player development
              </p>
              <Button size="lg" onClick={() => setShowCreateTeam(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card
                key={team._id}
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => setSelectedTeamId(team._id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span>{team.name || "Unnamed Team"}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {team.evaluator ? `Coach: ${team.evaluator}` : "No coach assigned"}
                    {team.memberRole === "owner" ? (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {team.memberRole === "coach" ? "Coach" : "Viewer"}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {team.createdAt ? `Created ${new Date(team.createdAt).toLocaleDateString()}` : ""}
                    </span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      View Team
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Enter a name for your new team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newTeamName">Team Name</Label>
                <Input
                  id="newTeamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateTeam()}
                  placeholder="e.g., Eagles U12"
                  className="h-12"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam}>
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Team Modal */}
        <JoinTeamDialog
          open={showJoinTeam}
          onOpenChange={setShowJoinTeam}
          onSuccess={(teamId) => {
            // Optionally select the joined team
          }}
        />
      </div>
    );
  }

  // Check if user is owner of current team
  const isTeamOwner = selectedTeam?.memberRole === "owner";
  // Check if user can manage assessments (owner or coach)
  const canManageAssessments = selectedTeam?.memberRole === "owner" || selectedTeam?.memberRole === "coach";

  // Team management view
  return (
    <div>
      {/* Modals */}
      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Add a player to your team roster
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && confirmAddPlayer()}
                placeholder="Enter player name"
                className="h-12"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddPlayer}>
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssessments} onOpenChange={setShowAssessments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment History - {selectedPlayer?.name}</DialogTitle>
            <DialogDescription>
              View all past assessments and their detailed breakdowns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedPlayer?.assessments && selectedPlayer.assessments.length > 0 ? (
              selectedPlayer.assessments.map((assessment: any, index: number) => (
                <Card key={assessment._id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? "Latest" : `#${index + 1}`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(assessment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Evaluator:</span>{" "}
                            <span className="font-medium">{assessment.evaluator}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Overall Rating:</span>{" "}
                            <span className="text-xl font-bold text-primary">
                              {assessment.overallRating.toFixed(1)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/assessment-details/${assessment._id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No assessments yet</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssessments(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedTeamId(null)}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-foreground">{teamName || "Team Details"}</h1>
        <p className="text-muted-foreground mt-2">Manage roster and track player progress</p>
      </div>

      {/* Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Team Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="h-11"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Coach/Evaluator</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
              placeholder="Your name"
              className="h-11"
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button onClick={() => setShowAddPlayer(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Player
        </Button>
        <Button onClick={handleSaveTeamData} variant="secondary" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button onClick={exportData} variant="outline" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        {isTeamOwner && (
          <Button onClick={handleDeleteTeam} variant="destructive" size="lg">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        )}
      </div>

      {/* Team Roster */}
      <Card>
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl py-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <CardTitle className="text-xl">Team Roster</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-background text-foreground px-3 py-1">
              {players?.length || 0} Players
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!players || players.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">⚽</div>
              <p className="text-xl text-muted-foreground mb-2">No players added yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Click &quot;Add Player&quot; to get started!
              </p>
              <Button onClick={() => setShowAddPlayer(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Player
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block lg:hidden divide-y divide-border">
                {players.map((player) => {
                  const progress = getPlayerProgress(player);
                  const latestRating = getPlayerLatestRating(player);

                  return (
                    <div key={player._id} className="p-5 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Player Name</Label>
                        <Input
                          value={player.name}
                          onChange={(e) => handleUpdatePlayerInfo(player._id, "name", e.target.value)}
                          className="font-semibold h-11"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Jersey #</Label>
                          <Input
                            value={player.jerseyNumber ?? player.age ?? ""}
                            onChange={(e) => handleUpdatePlayerInfo(player._id, "jerseyNumber", e.target.value)}
                            placeholder="#"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Position</Label>
                          <Input
                            value={player.position || ""}
                            onChange={(e) => handleUpdatePlayerInfo(player._id, "position", e.target.value)}
                            placeholder="Position"
                            className="h-11"
                          />
                        </div>
                      </div>

                      {canManageAssessments && (
                        <div className="flex items-center justify-around py-4 bg-muted rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Assessments</p>
                            <Badge
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => handleViewAssessments(player)}
                            >
                              {player.assessments?.length || 0}
                            </Badge>
                          </div>
                          <Separator orientation="vertical" className="h-12" />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Rating</p>
                            <p className="text-xl font-bold text-foreground">{latestRating}</p>
                          </div>
                          {progress !== null && (
                            <>
                              <Separator orientation="vertical" className="h-12" />
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Progress</p>
                                <div className="flex items-center justify-center gap-1">
                                  {parseFloat(progress) >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-destructive" />
                                  )}
                                  <span className={`font-semibold ${parseFloat(progress) >= 0 ? "text-primary" : "text-destructive"}`}>
                                    {progress > "0" ? "+" : ""}{progress}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {canManageAssessments && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <Button asChild size="lg">
                            <Link href={`/assessment/${player._id}`}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Assess
                            </Link>
                          </Button>
                          <Button variant="destructive" size="lg" onClick={() => handleDeletePlayer(player._id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block overflow-x-auto p-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="py-4">Player Name</TableHead>
                      <TableHead className="py-4">Jersey #</TableHead>
                      <TableHead className="py-4">Position</TableHead>
                      {canManageAssessments && (
                        <>
                          <TableHead className="py-4 text-center">Assessments</TableHead>
                          <TableHead className="py-4 text-center">Latest Rating</TableHead>
                          <TableHead className="py-4 text-center">Progress</TableHead>
                          <TableHead className="py-4 text-center">Actions</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => {
                      const progress = getPlayerProgress(player);
                      return (
                        <TableRow key={player._id}>
                          <TableCell className="py-4">
                            <Input
                              value={player.name}
                              onChange={(e) => handleUpdatePlayerInfo(player._id, "name", e.target.value)}
                              className="max-w-[200px] h-10"
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <Input
                              value={player.jerseyNumber ?? player.age ?? ""}
                              onChange={(e) => handleUpdatePlayerInfo(player._id, "jerseyNumber", e.target.value)}
                              placeholder="#"
                              className="w-20 h-10"
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <Input
                              value={player.position || ""}
                              onChange={(e) => handleUpdatePlayerInfo(player._id, "position", e.target.value)}
                              placeholder="Position"
                              className="w-32 h-10"
                            />
                          </TableCell>
                          {canManageAssessments && (
                            <>
                              <TableCell className="py-4 text-center">
                                <Badge
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-accent"
                                  onClick={() => handleViewAssessments(player)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {player.assessments?.length || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 text-center">
                                <span className="text-lg font-bold text-foreground">
                                  {getPlayerLatestRating(player)}
                                </span>
                              </TableCell>
                              <TableCell className="py-4 text-center">
                                {progress !== null && (
                                  <div className="flex items-center justify-center gap-1">
                                    {parseFloat(progress) >= 0 ? (
                                      <TrendingUp className="h-4 w-4 text-primary" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-destructive" />
                                    )}
                                    <span className={`font-semibold ${parseFloat(progress) >= 0 ? "text-primary" : "text-destructive"}`}>
                                      {progress > "0" ? "+" : ""}{progress}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex gap-3 justify-center">
                                  <Button asChild>
                                    <Link href={`/assessment/${player._id}`}>
                                      Assess
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeletePlayer(player._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Team Members Card */}
      {selectedTeamId && (
        <div className="mt-8">
          <TeamMembersCard teamId={selectedTeamId} isOwner={isTeamOwner} />
        </div>
      )}
    </div>
  );
}
