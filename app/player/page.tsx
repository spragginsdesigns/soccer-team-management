"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, TrendingUp, Calendar, Target } from "lucide-react";

export default function PlayerPortal() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userProfile = useQuery(
    api.userProfiles.get,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (userProfile === null) {
      router.replace("/onboarding");
    } else if (userProfile && userProfile.role !== "player") {
      router.replace("/");
    }
  }, [userProfile, router]);

  if (authLoading || userProfile === undefined) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !userProfile || userProfile.role !== "player") {
    return null;
  }

  const linkedPlayers = userProfile.linkedPlayerIds || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Player Portal</h1>
          <p className="text-muted-foreground mt-2">
            View your assessments and track your progress
          </p>
        </div>

        {linkedPlayers.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Not Linked to a Team Yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ask your coach to link your account to your player profile.
                Once linked, you&apos;ll be able to see your assessments and track your progress.
              </p>
              <Badge variant="secondary" className="text-sm">
                Waiting for coach to link your profile
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">--</p>
                <p className="text-sm text-muted-foreground">Overall improvement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-primary" />
                  Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total assessments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Latest Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">--</p>
                <p className="text-sm text-muted-foreground">Current overall</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              We&apos;re working on more features for the player portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                View detailed skill breakdowns
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Track progress over time with charts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Set personal goals and milestones
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Compare performance across assessments
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
