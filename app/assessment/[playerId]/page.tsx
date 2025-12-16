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
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Printer } from "lucide-react";

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
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Player Assessment
          </h1>
          <p className="text-muted-foreground">
            Evaluating: <span className="font-bold text-foreground">{player.name}</span>
          </p>
        </div>

        {/* Player Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={player.position || ""}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Jersey #</Label>
                <Input
                  value={player.jerseyNumber ?? player.age ?? ""}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Assessment Date</Label>
                <Input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluator Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label>Evaluator Name</Label>
              <Input
                value={evaluator}
                onChange={(e) => setEvaluator(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rating Scale Guide */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rating Scale Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              {RATING_LEVELS.map((level) => (
                <div key={level.value} className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${level.colorClass} rounded`}></div>
                  <span className="text-muted-foreground">{level.value} - {level.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Categories */}
        {ASSESSMENT_CATEGORIES.map((category) => (
          <Card key={category.id} className="mb-6 overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">{category.name}</CardTitle>
                <Badge variant="secondary" className="bg-background text-foreground">
                  Avg: {calculateCategoryAverage(category, ratings)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {category.skills.map((skill) => {
                const key = getLegacyRatingKey(category.name, skill.name);
                const currentRating = ratings[key];

                return (
                  <div
                    key={skill.id}
                    className="mb-4 pb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-foreground">{skill.name}</span>
                      {currentRating && (
                        <span className="text-sm text-muted-foreground italic">
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
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      value={notes[key] || ""}
                      onChange={(e) =>
                        handleNote(category.name, skill.name, e.target.value)
                      }
                      placeholder="Add notes or observations..."
                      rows={2}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Overall Rating */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Overall Rating</h2>
              <div className="text-4xl font-bold text-primary">
                {calculateOverallAverage(ratings).toFixed(1)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 no-print">
          <Button onClick={handleSaveAssessment} className="flex-1" size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save Assessment
          </Button>
          <Button
            onClick={() => window.print()}
            variant="secondary"
            className="flex-1"
            size="lg"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Assessment
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
