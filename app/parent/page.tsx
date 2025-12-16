"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, Calendar, Bell } from "lucide-react";

export default function ParentPortal() {
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
    } else if (userProfile && userProfile.role !== "parent") {
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

  if (!isAuthenticated || !userProfile || userProfile.role !== "parent") {
    return null;
  }

  const linkedPlayers = userProfile.linkedPlayerIds || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parent Portal</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your child&apos;s development and progress
          </p>
        </div>

        {linkedPlayers.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No Players Linked Yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ask your child&apos;s coach to link your account to your player&apos;s profile.
                Once linked, you&apos;ll be able to view their assessments and track their development.
              </p>
              <Badge variant="secondary" className="text-sm">
                Waiting for coach to link player profile
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" />
                    Linked Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{linkedPlayers.length}</p>
                  <p className="text-sm text-muted-foreground">Children tracked</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">--</p>
                  <p className="text-sm text-muted-foreground">Last assessment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">--</p>
                  <p className="text-sm text-muted-foreground">Overall improvement</p>
                </CardContent>
              </Card>
            </div>

            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Children</CardTitle>
                <CardDescription>
                  Players linked to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Player details will appear here once linked
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Coming Soon
            </CardTitle>
            <CardDescription>
              We&apos;re working on more features for parents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                View detailed assessment reports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Get notifications when new assessments are added
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Track progress with visual charts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Message coaches directly
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
