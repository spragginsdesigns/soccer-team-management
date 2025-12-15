"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ASSESSMENT_CATEGORIES, getLegacyRatingKey, RATING_LEVELS } from "@/lib/assessmentSchema";
import {
  getRatingColor,
  getRatingLabel,
  calculateCategoryAverage,
  calculateOverallAverage,
} from "@/lib/assessmentUtils";

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.playerId as Id<"players">;

  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [evaluator, setEvaluator] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Queries
  const player = useQuery(api.players.getById, { playerId });

  // Mutations
  const createAssessment = useMutation(api.assessments.create);

  useEffect(() => {
    if (player && player.assessments && player.assessments.length > 0) {
      const latest = player.assessments[0];
      setEvaluator(latest.evaluator);
    }
  }, [player]);

  const handleRating = (categoryName: string, skillName: string, rating: number) => {
    const key = getLegacyRatingKey(categoryName, skillName);
    setRatings((prev) => ({
      ...prev,
      [key]: rating,
    }));
  };

  const handleNote = (categoryName: string, skillName: string, note: string) => {
    const key = getLegacyRatingKey(categoryName, skillName);
    setNotes((prev) => ({
      ...prev,
      [key]: note,
    }));
  };

  const handleSaveAssessment = async () => {
    if (!player) return;

    const overallRating = calculateOverallAverage(ratings);

    await createAssessment({
      playerId: player._id,
      teamId: player.teamId,
      date: assessmentDate,
      evaluator,
      ratings,
      notes,
      overallRating,
    });

    toast.success("Assessment saved successfully!");
    router.push("/");
  };

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6 border-b-4 border-green-600 pb-4">
        <Link
          href="/"
          className="mb-4 text-green-600 hover:text-green-700 font-semibold no-print inline-block"
        >
          ← Back to Team
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Player Assessment
        </h1>
        <p className="text-gray-600">
          Evaluating: <span className="font-bold">{player.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <input
            type="text"
            value={player.position || ""}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jersey #
          </label>
          <input
            type="text"
            value={player.jerseyNumber ?? player.age ?? ""}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Date
          </label>
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Evaluator Name
        </label>
        <input
          type="text"
          value={evaluator}
          onChange={(e) => setEvaluator(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Your name"
        />
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Rating Scale Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
          {RATING_LEVELS.map((level) => (
            <div key={level.value} className="flex items-center gap-2">
              <div className={`w-6 h-6 ${level.colorClass} rounded`}></div>
              <span>{level.value} - {level.label}</span>
            </div>
          ))}
        </div>
      </div>

      {ASSESSMENT_CATEGORIES.map((category) => (
        <div
          key={category.id}
          className="mb-6 border border-gray-300 rounded-lg overflow-hidden"
        >
          <div className="bg-green-600 text-white px-4 py-3 flex justify-between items-center">
            <h2 className="text-xl font-bold">{category.name}</h2>
            <span className="bg-white text-green-600 px-3 py-1 rounded-full font-semibold">
              Avg: {calculateCategoryAverage(category, ratings)}
            </span>
          </div>

          <div className="p-4">
            {category.skills.map((skill) => {
              const key = getLegacyRatingKey(category.name, skill.name);
              const currentRating = ratings[key];

              return (
                <div
                  key={skill.id}
                  className="mb-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">{skill.name}</span>
                    {currentRating && (
                      <span className="text-sm text-gray-600 italic">
                        {getRatingLabel(currentRating)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          handleRating(category.name, skill.name, rating)
                        }
                        className={`flex-1 py-2 px-3 rounded font-semibold transition-all ${
                          currentRating === rating
                            ? `${getRatingColor(rating)} text-white`
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={notes[key] || ""}
                    onChange={(e) =>
                      handleNote(category.name, skill.name, e.target.value)
                    }
                    placeholder="Add notes or observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-gray-800 text-white p-6 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Overall Rating</h2>
          <div className="text-4xl font-bold">
            {calculateOverallAverage(ratings).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 no-print">
        <button
          onClick={handleSaveAssessment}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <span>💾</span>
          Save Assessment
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <span>🖨️</span>
          Print Assessment
        </button>
      </div>
    </div>
  );
}
