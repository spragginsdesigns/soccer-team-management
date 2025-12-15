"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Save, Download, Trophy, TrendingUp, TrendingDown, Calendar, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { SignOutButton } from "@/components/auth/SignOutButton";

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

  // Queries
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

  // Auto-select first team if only one exists
  useEffect(() => {
    if (teams && teams.length === 1 && !selectedTeamId) {
      setSelectedTeamId(teams[0]._id);
    }
  }, [teams, selectedTeamId]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Team selection view
  if (!selectedTeamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  FormUp
                </h1>
                <p className="text-muted-foreground">Select a team to manage</p>
              </div>
            </div>
            <SignOutButton variant="outline" />
          </div>

          {/* Teams Grid */}
          {teams.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">⚽</div>
                <h2 className="text-2xl font-semibold mb-2">No teams yet</h2>
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {teams.map((team) => (
                  <Card
                    key={team._id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedTeamId(team._id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {team.name || "Unnamed Team"}
                      </CardTitle>
                      <CardDescription>
                        {team.evaluator ? `Coach: ${team.evaluator}` : "No coach assigned"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button onClick={() => setShowCreateTeam(true)} size="lg" className="w-full md:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Create New Team
              </Button>
            </>
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
                <Button onClick={handleCreateTeam}>Create Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Team management view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Add Player Modal */}
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
                  className="h-12 text-base"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowAddPlayer(false)} className="h-12">
                Cancel
              </Button>
              <Button onClick={confirmAddPlayer} className="h-12">Add Player</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assessments History Modal */}
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

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            {/* Back button and title */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedTeamId(null)}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                All Teams
              </Button>
              <SignOutButton variant="outline" size="sm" />
            </div>

            {/* Title Section */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  FormUp
                </h1>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                Track your team&apos;s development
              </p>
            </div>
          </div>
        </div>

        {/* Team Info Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Team Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="h-11 sm:h-10"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Coach/Evaluator</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={evaluator}
                onChange={(e) => setEvaluator(e.target.value)}
                placeholder="Your name"
                className="h-11 sm:h-10"
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button onClick={() => setShowAddPlayer(true)} size="lg" className="h-12 sm:h-11 w-full">
            <Plus className="h-5 w-5 mr-2" />
            Add Player
          </Button>
          <Button onClick={handleSaveTeamData} variant="secondary" size="lg" className="h-12 sm:h-11 w-full">
            <Save className="h-5 w-5 mr-2" />
            Save Data
          </Button>
          <Button onClick={exportData} variant="outline" size="lg" className="h-12 sm:h-11 w-full">
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleDeleteTeam} variant="destructive" size="lg" className="h-12 sm:h-11 w-full">
            Delete Team
          </Button>
        </div>

        {/* Team Roster */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Team Roster</CardTitle>
              </div>
              <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1">
                {players?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!players || players.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="text-6xl sm:text-8xl mb-4">⚽</div>
                <p className="text-lg sm:text-xl text-muted-foreground mb-2">
                  No players added yet
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Click &quot;Add Player&quot; to get started!
                </p>
                <Button onClick={() => setShowAddPlayer(true)} size="lg" className="h-12">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Player
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="block lg:hidden">
                  {players.map((player) => {
                    const progress = getPlayerProgress(player);
                    const latestRating = getPlayerLatestRating(player);

                    return (
                      <div key={player._id} className="border-b last:border-b-0">
                        <div className="p-4 space-y-3">
                          {/* Player Name - Editable */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1">Player Name</Label>
                            <Input
                              value={player.name}
                              onChange={(e) =>
                                handleUpdatePlayerInfo(player._id, "name", e.target.value)
                              }
                              className="font-semibold text-base h-11"
                            />
                          </div>

                          {/* Jersey # & Position */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">Jersey #</Label>
                              <Input
                                value={player.jerseyNumber ?? player.age ?? ""}
                                onChange={(e) =>
                                  handleUpdatePlayerInfo(player._id, "jerseyNumber", e.target.value)
                                }
                                placeholder="Jersey #"
                                className="h-11"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">Position</Label>
                              <Input
                                value={player.position || ""}
                                onChange={(e) =>
                                  handleUpdatePlayerInfo(player._id, "position", e.target.value)
                                }
                                placeholder="Position"
                                className="h-11"
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-around py-3 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Assessments</p>
                              <Badge
                                variant="secondary"
                                className="text-base px-3 py-1 cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleViewAssessments(player)}
                              >
                                {player.assessments?.length || 0}
                              </Badge>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Rating</p>
                              <p className="text-xl font-bold">{latestRating}</p>
                            </div>
                            {progress !== null && (
                              <>
                                <Separator orientation="vertical" className="h-10" />
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Progress</p>
                                  <div className="flex items-center justify-center gap-1">
                                    {parseFloat(progress) >= 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <span
                                      className={`font-semibold ${
                                        parseFloat(progress) >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {progress > "0" ? "+" : ""}
                                      {progress}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-2">
                            <Button asChild size="lg" className="h-12 w-full">
                              <Link href={`/assessment/${player._id}`}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Assess
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="lg"
                              onClick={() => handleDeletePlayer(player._id)}
                              className="h-12 w-full"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Jersey #</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead className="text-center">Assessments</TableHead>
                        <TableHead className="text-center">Latest Rating</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => {
                        const progress = getPlayerProgress(player);
                        return (
                          <TableRow key={player._id} className="hover:bg-muted/50">
                            <TableCell>
                              <Input
                                value={player.name}
                                onChange={(e) =>
                                  handleUpdatePlayerInfo(
                                    player._id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="max-w-[200px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={player.jerseyNumber ?? player.age ?? ""}
                                onChange={(e) =>
                                  handleUpdatePlayerInfo(
                                    player._id,
                                    "jerseyNumber",
                                    e.target.value
                                  )
                                }
                                placeholder="Jersey #"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={player.position || ""}
                                onChange={(e) =>
                                  handleUpdatePlayerInfo(
                                    player._id,
                                    "position",
                                    e.target.value
                                  )
                                }
                                placeholder="Position"
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleViewAssessments(player)}
                              >
                                {player.assessments?.length || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-lg font-bold">
                                {getPlayerLatestRating(player)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {progress !== null && (
                                <div className="flex items-center justify-center gap-1">
                                  {parseFloat(progress) >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span
                                    className={`font-semibold ${
                                      parseFloat(progress) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {progress > "0" ? "+" : ""}
                                    {progress}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-center">
                                <Button asChild size="sm">
                                  <Link href={`/assessment/${player._id}`}>
                                    Assess
                                  </Link>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeletePlayer(player._id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
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
      </div>
    </div>
  );
}
