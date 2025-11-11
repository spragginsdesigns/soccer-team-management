"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Trophy } from "lucide-react";

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

export default function AssessmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as Id<"assessments">;

  // We need to create a query to get a single assessment by ID
  const assessment = useQuery(api.assessments.getById, { id: assessmentId });

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
    if (!assessment?.ratings) return "0.0";

    const categoryRatings = category.skills
      .map((skill) => assessment.ratings[`${category.name}-${skill}`])
      .filter((r) => r !== undefined);

    if (categoryRatings.length === 0) return "0.0";
    return (
      categoryRatings.reduce((a: number, b: number) => a + b, 0) / categoryRatings.length
    ).toFixed(1);
  };

  if (!assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold">{new Date(assessment.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Evaluator</p>
                    <p className="font-semibold">{assessment.evaluator}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Rating</p>
                    <p className="text-2xl font-bold text-primary">
                      {assessment.overallRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {categories.map((category, idx) => {
          const categoryAvg = calculateCategoryAverage(category);

          return (
            <Card key={idx} className="mb-4 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    Avg: {categoryAvg}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {category.skills.map((skill, skillIdx) => {
                  const key = `${category.name}-${skill}`;
                  const rating = assessment.ratings?.[key];
                  const note = assessment.notes?.[key];

                  return (
                    <div
                      key={skillIdx}
                      className="mb-4 pb-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{skill}</span>
                        {rating && (
                          <Badge
                            variant="outline"
                            className={`${getRatingColor(rating)} text-white border-none`}
                          >
                            {rating} - {getRatingLabel(rating)}
                          </Badge>
                        )}
                      </div>

                      {/* Rating visualization */}
                      {rating && (
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <div
                              key={r}
                              className={`flex-1 h-2 rounded ${
                                r <= rating
                                  ? getRatingColor(rating)
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {note && (
                        <div className="bg-gray-50 p-3 rounded-md mt-2">
                          <p className="text-sm text-gray-700">{note}</p>
                        </div>
                      )}

                      {!rating && !note && (
                        <p className="text-sm text-gray-400 italic">Not assessed</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Print Button */}
        <div className="flex gap-2 no-print mt-6">
          <Button
            onClick={() => window.print()}
            className="flex-1"
            size="lg"
          >
            Print Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
