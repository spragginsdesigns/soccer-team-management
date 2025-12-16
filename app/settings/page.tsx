"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, Database, UserCog, ClipboardList, User, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Role = "coach" | "player" | "parent";

const roleInfo: Record<Role, { label: string; icon: React.ReactNode; description: string }> = {
  coach: {
    label: "Coach",
    icon: <ClipboardList className="h-4 w-4" />,
    description: "Create and manage teams, assess players",
  },
  player: {
    label: "Player",
    icon: <User className="h-4 w-4" />,
    description: "View your assessments and progress",
  },
  parent: {
    label: "Parent",
    icon: <Users className="h-4 w-4" />,
    description: "Monitor your child's development",
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const userProfile = useQuery(api.userProfiles.get);
  const updateRole = useMutation(api.userProfiles.updateRole);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleRoleChange = async (newRole: Role) => {
    if (!userProfile || userProfile.role === newRole) return;

    setIsChangingRole(true);
    try {
      await updateRole({ role: newRole });
      toast.success(`Role changed to ${roleInfo[newRole].label}`);
      // Redirect to appropriate page based on new role
      if (newRole === "player") {
        router.push("/player");
      } else if (newRole === "parent") {
        router.push("/parent");
      } else {
        router.push("/");
      }
    } catch (error) {
      toast.error("Failed to change role");
    } finally {
      setIsChangingRole(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your application preferences</p>
        </div>

        {/* Role Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserCog className="h-5 w-5 text-primary" />
              Account Role
            </CardTitle>
            <CardDescription>Change how you use the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userProfile && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Current role:</span>
                <Badge className="bg-primary/10 text-primary">
                  {roleInfo[userProfile.role].icon}
                  <span className="ml-1">{roleInfo[userProfile.role].label}</span>
                </Badge>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(roleInfo) as Role[]).map((role) => (
                <Button
                  key={role}
                  variant={userProfile?.role === role ? "default" : "outline"}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => handleRoleChange(role)}
                  disabled={isChangingRole || userProfile?.role === role}
                >
                  {isChangingRole ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {roleInfo[role].icon}
                      </div>
                      <span className="font-medium">{roleInfo[role].label}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {roleInfo[role].description}
                      </span>
                    </>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Assessment Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded to assess players</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              Privacy
            </CardTitle>
            <CardDescription>Control your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Share Analytics</Label>
                <p className="text-sm text-muted-foreground">Help improve FormUp with usage data</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Data Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
            <CardDescription>Export or delete your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline">
                Export All Data
              </Button>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
