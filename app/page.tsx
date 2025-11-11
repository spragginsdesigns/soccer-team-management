"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export default function Home() {
  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);
  const [teamName, setTeamName] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Queries
  const teams = useQuery(api.teams.getAll);
  const team = useQuery(api.teams.getById, teamId ? { teamId } : "skip");
  const players = useQuery(api.players.getByTeam, teamId ? { teamId } : "skip");

  // Mutations
  const createTeam = useMutation(api.teams.create);
  const updateTeam = useMutation(api.teams.update);
  const createPlayer = useMutation(api.players.create);
  const updatePlayer = useMutation(api.players.update);
  const deletePlayer = useMutation(api.players.remove);

  // Initialize team on first load
  useEffect(() => {
    if (teams && isInitializing) {
      if (teams.length > 0) {
        // Use the first team (for now, single team per user)
        const firstTeam = teams[0];
        setTeamId(firstTeam._id);
        setTeamName(firstTeam.name);
        setEvaluator(firstTeam.evaluator);
      } else {
        // Create a default team
        createTeam({ name: "", evaluator: "" }).then((id) => {
          setTeamId(id);
        });
      }
      setIsInitializing(false);
    }
  }, [teams, isInitializing, createTeam]);

  // Update team info when changed
  const handleSaveTeamData = async () => {
    if (teamId) {
      await updateTeam({
        id: teamId,
        name: teamName,
        evaluator: evaluator,
      });
      alert("Team data saved successfully!");
    }
  };

  const handleAddPlayer = () => {
    setShowAddPlayer(true);
  };

  const confirmAddPlayer = async () => {
    if (newPlayerName.trim() && teamId) {
      await createPlayer({
        teamId,
        name: newPlayerName.trim(),
      });
      setNewPlayerName("");
      setShowAddPlayer(false);
    }
  };

  const cancelAddPlayer = () => {
    setNewPlayerName("");
    setShowAddPlayer(false);
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
    a.download = `${teamName || "team"}-assessments-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  };

  if (isInitializing || !teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6 border-b-4 border-green-600 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Team Assessment Manager
        </h1>
        <p className="text-gray-600">
          Track your team&apos;s development throughout the season
        </p>
      </div>

      {showAddPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Add New Player</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Name
            </label>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && confirmAddPlayer()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              placeholder="Enter player name"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={confirmAddPlayer}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              >
                Add Player
              </button>
              <button
                onClick={cancelAddPlayer}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter team name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coach/Evaluator Name
          </label>
          <input
            type="text"
            value={evaluator}
            onChange={(e) => setEvaluator(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Your name"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleAddPlayer}
          className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <span>➕</span>
          Add Player
        </button>
        <button
          onClick={handleSaveTeamData}
          className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <span>💾</span>
          Save Team Data
        </button>
        <button
          onClick={exportData}
          className="flex-1 min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <span>⬇️</span>
          Export
        </button>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <h2 className="text-xl font-bold">
            Team Roster ({players?.length || 0} players)
          </h2>
        </div>

        {!players || players.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-lg">
              No players added yet. Click &quot;Add Player&quot; to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Player Name</th>
                  <th className="px-4 py-3 text-left">Age</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  <th className="px-4 py-3 text-center">Assessments</th>
                  <th className="px-4 py-3 text-center">Latest Rating</th>
                  <th className="px-4 py-3 text-center">Progress</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const progress = getPlayerProgress(player);
                  return (
                    <tr
                      key={player._id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) =>
                            handleUpdatePlayerInfo(
                              player._id,
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={player.age || ""}
                          onChange={(e) =>
                            handleUpdatePlayerInfo(
                              player._id,
                              "age",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="Age"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={player.position || ""}
                          onChange={(e) =>
                            handleUpdatePlayerInfo(
                              player._id,
                              "position",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="Position"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {player.assessments?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-lg">
                          {getPlayerLatestRating(player)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {progress !== null && (
                          <span
                            className={`font-semibold ${
                              parseFloat(progress) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {parseFloat(progress) >= 0 ? "📈" : "📉"}{" "}
                            {progress > "0" ? "+" : ""}
                            {progress}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Link
                            href={`/assessment/${player._id}`}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm"
                          >
                            Assess
                          </Link>
                          <button
                            onClick={() => handleDeletePlayer(player._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
