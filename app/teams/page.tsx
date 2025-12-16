"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function TeamsPage() {
  const router = useRouter();
  const teams = useQuery(api.teams.getAll);

  if (teams === undefined) {
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
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-2">View and manage all your teams</p>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">⚽</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">No teams yet</h2>
              <p className="text-muted-foreground">
                Go to the Dashboard to create your first team
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card
                key={team._id}
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => router.push(`/?team=${team._id}`)}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <span>{team.name || "Unnamed Team"}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {team.evaluator ? `Coach: ${team.evaluator}` : "No coach assigned"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      View Team
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
