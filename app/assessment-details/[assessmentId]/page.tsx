"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, User, Trophy, Printer, Trash2, ShieldAlert } from "lucide-react";
import { ASSESSMENT_CATEGORIES, getLegacyRatingKey } from "@/lib/assessmentSchema";
import { getRatingColor, getRatingLabel, calculateCategoryAverage } from "@/lib/assessmentUtils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";

export default function AssessmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as Id<"assessments">;
  const [isDeleting, setIsDeleting] = useState(false);

  // Assessment query - will return null for non-coaches due to verifyTeamModifyAccess
  const assessment = useQuery(api.assessments.getById, { id: assessmentId });
  const deleteAssessment = useMutation(api.assessments.remove);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAssessment({ id: assessmentId });
      toast.success("Assessment deleted successfully");
      router.back();
    } catch (error) {
      toast.error("Failed to delete assessment");
      setIsDeleting(false);
    }
  };

  // Loading state
  if (assessment === undefined) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Assessment not found or access denied (viewers get null from the query)
  if (!assessment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <div className="text-xl font-semibold text-foreground">Access Denied</div>
          <p className="text-muted-foreground text-center max-w-md">
            Only coaches can view assessment details. This assessment may not exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
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
            onClick={() => router.back()}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
        {ASSESSMENT_CATEGORIES.map((category) => {
          const categoryAvg = calculateCategoryAverage(category, assessment.ratings ?? {});

          return (
            <Card key={category.id} className="mb-6 overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <Badge variant="secondary" className="text-base px-3 py-1 bg-background text-foreground">
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
                      className="mb-4 pb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-foreground">{skill.name}</span>
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
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {note && (
                        <div className="bg-muted p-3 rounded-md mt-2">
                          <p className="text-sm text-muted-foreground">{note}</p>
                        </div>
                      )}

                      {!rating && !note && (
                        <p className="text-sm text-muted-foreground italic">Not assessed</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Action Buttons */}
        <div className="flex gap-2 no-print mt-6">
          <Button
            onClick={() => window.print()}
            className="flex-1"
            size="lg"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Assessment
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this assessment from{" "}
                  {new Date(assessment.date).toLocaleDateString()}. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete Assessment"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
