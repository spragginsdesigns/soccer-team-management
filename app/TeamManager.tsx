"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Save, Download, Share2, LogOut, Trophy, TrendingUp, TrendingDown } from "lucide-react";

export default function TeamManager() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [showTeamCodeModal, setShowTeamCodeModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Queries
  const team = useQuery(
    api.teams.getByTeamCode,
    teamCode ? { teamCode } : "skip"
  );
  const players = useQuery(
    api.players.getByTeam,
    team ? { teamId: team._id } : "skip"
  );

  // Mutations
  const createTeam = useMutation(api.teams.create);
  const updateTeam = useMutation(api.teams.update);
  const createPlayer = useMutation(api.players.create);
  const updatePlayer = useMutation(api.players.update);
  const deletePlayer = useMutation(api.players.remove);

  // Initialize team code from URL or localStorage
  useEffect(() => {
    if (!isInitializing) return;

    const urlTeamCode = searchParams.get("team");
    if (urlTeamCode) {
      setTeamCode(urlTeamCode);
      localStorage.setItem("teamCode", urlTeamCode);
      setIsInitializing(false);
      return;
    }

    const savedTeamCode = localStorage.getItem("teamCode");
    if (savedTeamCode) {
      setTeamCode(savedTeamCode);
      router.push(`/?team=${savedTeamCode}`);
      setIsInitializing(false);
      return;
    }

    setShowTeamCodeModal(true);
    setIsInitializing(false);
  }, [isInitializing, searchParams, router]);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setEvaluator(team.evaluator);
    }
  }, [team]);

  const handleSubmitTeamCode = async () => {
    if (!teamCodeInput.trim()) {
      alert("Please enter a team code");
      return;
    }

    const code = teamCodeInput.trim().toUpperCase().replace(/\s+/g, "");
    setTeamCode(code);
    localStorage.setItem("teamCode", code);
    router.push(`/?team=${code}`);
    setShowTeamCodeModal(false);
    setTeamCodeInput("");
  };

  useEffect(() => {
    if (teamCode && team === null && !isInitializing) {
      createTeam({
        teamCode,
        name: "",
        evaluator: "",
      }).catch((error) => {
        console.error("Error creating team:", error);
      });
    }
  }, [teamCode, team, isInitializing, createTeam]);

  const handleSaveTeamData = async () => {
    if (team) {
      await updateTeam({
        id: team._id,
        name: teamName,
        evaluator: evaluator,
      });
      alert("Team data saved successfully!");
    }
  };

  const confirmAddPlayer = async () => {
    if (newPlayerName.trim() && team) {
      await createPlayer({
        teamId: team._id,
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
    field: "name" | "age" | "position",
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
    const data = {
      teamCode,
      teamName,
      evaluator,
      players: players || [],
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${teamCode || "team"}-assessments-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/?team=${teamCode}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Team Code Modal */}
        <Dialog open={showTeamCodeModal} onOpenChange={setShowTeamCodeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Enter Team Code</DialogTitle>
              <DialogDescription>
                Enter your team code to access your team&apos;s data. Share this code with other coaches.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teamCode">Team Code</Label>
                <Input
                  id="teamCode"
                  value={teamCodeInput}
                  onChange={(e) => setTeamCodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmitTeamCode()}
                  placeholder="e.g., EAGLES2025"
                  className="uppercase"
                  autoFocus
                />
              </div>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Choose a memorable code like &quot;EAGLES2025&quot; or &quot;PANTHERS-U12&quot;
                  </p>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmitTeamCode} className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAddPlayer}>Add Player</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        {teamCode && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Team Assessment Manager
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Track your team&apos;s development throughout the season
                  </p>
                </div>
                <Card className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground border-0">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold opacity-90">TEAM CODE</p>
                    <p className="text-2xl font-bold mb-3">{teamCode}</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyShareLink}
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Share Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTeamCodeModal(true)}
                        className="w-full hover:bg-white/20"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Switch Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Team Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Name</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Coach/Evaluator</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={evaluator}
                    onChange={(e) => setEvaluator(e.target.value)}
                    placeholder="Your name"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button onClick={() => setShowAddPlayer(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Player
              </Button>
              <Button onClick={handleSaveTeamData} variant="secondary" size="lg">
                <Save className="h-5 w-5 mr-2" />
                Save Team Data
              </Button>
              <Button onClick={exportData} variant="outline" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
            </div>

            {/* Team Roster */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6" />
                    <CardTitle className="text-2xl">Team Roster</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {players?.length || 0} players
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!players || players.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-8xl mb-4">⚽</div>
                    <p className="text-xl text-muted-foreground">
                      No players added yet
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Click &quot;Add Player&quot; to get started!
                    </p>
                    <Button onClick={() => setShowAddPlayer(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Player
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player Name</TableHead>
                          <TableHead>Age</TableHead>
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
                                  value={player.age || ""}
                                  onChange={(e) =>
                                    handleUpdatePlayerInfo(
                                      player._id,
                                      "age",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Age"
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
                                <Badge variant="secondary">
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
                                    <Link href={`/assessment/${player._id}?team=${teamCode}`}>
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
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
