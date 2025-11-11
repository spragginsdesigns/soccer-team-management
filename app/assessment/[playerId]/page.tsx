"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const categories = [
  {
    name: "Technical Skills",
    skills: [
      "Ball Control & First Touch",
      "Passing (short & long)",
      "Dribbling",
      "Shooting",
      "Heading",
      "Weak Foot Ability",
    ],
  },
  {
    name: "Tactical Understanding",
    skills: [
      "Positioning & Awareness",
      "Decision Making",
      "Off-the-Ball Movement",
      "Defensive Organization",
      "Attacking Support",
      "Game Reading",
    ],
  },
  {
    name: "Physical Attributes",
    skills: [
      "Speed & Acceleration",
      "Stamina & Endurance",
      "Strength",
      "Agility & Balance",
      "Jumping Ability",
      "Overall Fitness",
    ],
  },
  {
    name: "Mental & Psychological",
    skills: [
      "Concentration & Focus",
      "Confidence",
      "Composure Under Pressure",
      "Teamwork & Communication",
      "Coachability",
      "Leadership",
    ],
  },
];

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

  const handleRating = (category: string, skill: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [`${category}-${skill}`]: rating,
    }));
  };

  const handleNote = (category: string, skill: string, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [`${category}-${skill}`]: note,
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-500";
    if (rating >= 3) return "bg-blue-500";
    if (rating >= 2) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: "Needs Development",
      2: "Developing",
      3: "Competent",
      4: "Advanced",
      5: "Elite",
    };
    return labels[rating] || "";
  };

  const calculateCategoryAverage = (category: { name: string; skills: string[] }) => {
    const categoryRatings = category.skills
      .map((skill) => ratings[`${category.name}-${skill}`])
      .filter((r) => r !== undefined);

    if (categoryRatings.length === 0) return "0.0";
    return (
      categoryRatings.reduce((a, b) => a + b, 0) / categoryRatings.length
    ).toFixed(1);
  };

  const calculateOverallAverage = () => {
    const allRatings = Object.values(ratings).filter((r) => r !== undefined);
    if (allRatings.length === 0) return 0;
    return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
  };

  const handleSaveAssessment = async () => {
    if (!player) return;

    const overallRating = calculateOverallAverage();

    await createAssessment({
      playerId: player._id,
      teamId: player.teamId,
      date: assessmentDate,
      evaluator,
      ratings,
      notes,
      overallRating,
    });

    alert("Assessment saved!");
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
            Age
          </label>
          <input
            type="text"
            value={player.age || ""}
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
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span>1 - Needs Development</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span>2 - Developing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <span>3 - Competent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span>4 - Advanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span>5 - Elite</span>
          </div>
        </div>
      </div>

      {categories.map((category, idx) => (
        <div
          key={idx}
          className="mb-6 border border-gray-300 rounded-lg overflow-hidden"
        >
          <div className="bg-green-600 text-white px-4 py-3 flex justify-between items-center">
            <h2 className="text-xl font-bold">{category.name}</h2>
            <span className="bg-white text-green-600 px-3 py-1 rounded-full font-semibold">
              Avg: {calculateCategoryAverage(category)}
            </span>
          </div>

          <div className="p-4">
            {category.skills.map((skill, skillIdx) => {
              const key = `${category.name}-${skill}`;
              const currentRating = ratings[key];

              return (
                <div
                  key={skillIdx}
                  className="mb-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">{skill}</span>
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
                          handleRating(category.name, skill, rating)
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
                      handleNote(category.name, skill, e.target.value)
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
            {calculateOverallAverage().toFixed(1)}
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
