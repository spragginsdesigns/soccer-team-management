"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  User,
  Trophy,
  Printer,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  ASSESSMENT_CATEGORIES,
  getLegacyRatingKey,
} from "@/lib/assessmentSchema";
import {
  getRatingColor,
  getRatingLabel,
  calculateCategoryAverage,
} from "@/lib/assessmentUtils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function PlayerAssessmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as Id<"assessments">;

  // Use the player-specific query that allows linked players to view
  const assessment = useQuery(api.assessments.getByIdForPlayer, {
    id: assessmentId,
  });

  // Loading state
  if (assessment === undefined) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Assessment not found or access denied
  if (!assessment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <div className="text-xl font-semibold text-foreground">
            Access Denied
          </div>
          <p className="text-muted-foreground text-center max-w-md">
            This assessment may not exist or you don&apos;t have permission to
            view it.
          </p>
          <Button onClick={() => router.push("/player")}>
            Back to Player Portal
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/player")}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Player Portal
          </Button>

          <Card>
            <CardHeader className="bg-primary text-primary-foreground rounded-t-xl">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(assessment.date).toLocaleDateString()}
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      Overall Rating
                    </p>
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
        {ASSESSMENT_CATEGORIES.map((category) => {
          const categoryAvg = calculateCategoryAverage(
            category,
            assessment.ratings ?? {}
          );

          return (
            <Card key={category.id} className="mb-6 overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-base px-3 py-1 bg-background text-foreground"
                  >
                    Avg: {categoryAvg}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {category.skills.map((skill) => {
                  const key = getLegacyRatingKey(category.name, skill.name);
                  const rating = assessment.ratings?.[key];
                  const note = assessment.notes?.[key];

                  return (
                    <div
                      key={skill.id}
                      className="py-4 border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            {skill.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {rating ? (
                            <>
                              <Badge className={getRatingColor(rating)}>
                                {rating}
                              </Badge>
                              <span className="text-sm text-muted-foreground min-w-[100px]">
                                {getRatingLabel(rating)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not rated
                            </span>
                          )}
                        </div>
                      </div>
                      {note && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                          <span className="font-medium">Coach notes:</span>{" "}
                          {note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Print Button */}
        <div className="flex justify-center pb-8">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Assessment
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
