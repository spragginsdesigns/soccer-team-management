"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Clock,
  MapPin,
  Eye,
  User,
} from "lucide-react";

export default function ParentPortal() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userProfile = useQuery(
    api.userProfiles.get,
    isAuthenticated ? {} : "skip"
  );
  const linkedPlayers = useQuery(
    api.players.getMyLinkedPlayers,
    isAuthenticated && userProfile?.role === "parent" ? {} : "skip"
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

  if (authLoading || userProfile === undefined || linkedPlayers === undefined) {
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

  const hasLinkedPlayers = linkedPlayers && linkedPlayers.length > 0;
  const totalAssessments =
    linkedPlayers?.reduce(
      (sum, p) => sum + (p?.assessments?.length || 0),
      0
    ) || 0;

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

        {!hasLinkedPlayers ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No Players Linked Yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ask your child&apos;s coach to link your account to their player
                profile. Once linked, you&apos;ll be able to view their
                assessments and track their development.
              </p>
              <Badge variant="secondary" className="text-sm">
                Waiting for coach to link player profile
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" />
                    Children
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {linkedPlayers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Players linked
                  </p>
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
                  <p className="text-3xl font-bold text-foreground">
                    {totalAssessments}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total assessments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Latest Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {linkedPlayers[0]?.latestRating?.toFixed(1) || "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {linkedPlayers[0]?.name || "No player"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Children Profiles */}
            {linkedPlayers.filter((p): p is NonNullable<typeof p> => p !== null).map((player) => (
              <Card key={player._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {player.name}
                      </CardTitle>
                      <CardDescription>
                        {player.team?.name} • #{player.jerseyNumber || "--"} •{" "}
                        {player.position || "No position"}
                      </CardDescription>
                    </div>
                    {player.latestRating && (
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {player.latestRating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {player.assessments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No assessments yet</p>
                      <p className="text-sm mt-1">
                        The coach will add assessments as they evaluate your
                        child&apos;s progress
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">
                        Recent Assessments
                      </h4>
                      {player.assessments.slice(0, 5).map((assessment) => (
                        <Link
                          key={assessment._id}
                          href={`/parent/assessment/${assessment._id}`}
                        >
                          <div className="p-4 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {new Date(assessment.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Evaluated by {assessment.evaluator}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant={
                                    assessment.overallRating >= 4
                                      ? "default"
                                      : assessment.overallRating >= 3
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {assessment.overallRating.toFixed(1)}
                                </Badge>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {player.assessments.length > 5 && (
                        <p className="text-sm text-center text-muted-foreground pt-2">
                          + {player.assessments.length - 5} more assessments
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Team Schedule for first linked player's team */}
            {linkedPlayers[0]?.team && (
              <TeamScheduleViewer teamId={linkedPlayers[0].team._id} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Separate component for schedule to handle its own query
function TeamScheduleViewer({ teamId }: { teamId: any }) {
  const events = useQuery(api.scheduleEvents.getUpcoming, { teamId, limit: 5 });

  if (events === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getEventTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      practice: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      game: "bg-green-500/10 text-green-500 border-green-500/20",
      meeting: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return (
      <Badge className={styles[type] || styles.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatEventDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Team Schedule
        </CardTitle>
        <CardDescription>Upcoming team events and practices</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event._id}
                className="p-4 rounded-lg bg-muted/30 border"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{event.title}</h4>
                      {getEventTypeBadge(event.type)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatEventDate(event.startTime)} at{" "}
                        {formatEventTime(event.startTime)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {event.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
