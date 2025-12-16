"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Bell, Shield, Database, UserCog, ClipboardList, User, Users, Loader2, Lock, Download, Trash2 } from "lucide-react";
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
  const { signOut } = useAuthActions();
  const userProfile = useQuery(api.userProfiles.get);
  const userData = useQuery(api.userProfiles.exportAllData);
  const updateRole = useMutation(api.userProfiles.updateRole);
  const deleteAccount = useMutation(api.userProfiles.deleteAccount);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleExportData = async () => {
    if (!userData) {
      toast.error("No data available to export");
      return;
    }

    setIsExporting(true);
    try {
      const dataStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `formup-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      toast.success("Account deleted successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteConfirmText("");
    setShowDeleteConfirm(true);
  };

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
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={isChangingRole || userProfile?.role === role}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    userProfile?.role === role
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  } ${isChangingRole || userProfile?.role === role ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {isChangingRole ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <>
                      <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        userProfile?.role === role ? "bg-primary-foreground/20" : "bg-primary/10"
                      }`}>
                        {roleInfo[role].icon}
                      </div>
                      <p className="font-medium">{roleInfo[role].label}</p>
                      <p className={`text-xs mt-1 ${
                        userProfile?.role === role ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {roleInfo[role].description}
                      </p>
                    </>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Notifications
              <Badge variant="secondary" className="ml-auto text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Coming Soon
              </Badge>
            </CardTitle>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Assessment Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded to assess players</p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Privacy
              <Badge variant="secondary" className="ml-auto text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Coming Soon
              </Badge>
            </CardTitle>
            <CardDescription>Control your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Share Analytics</Label>
                <p className="text-sm text-muted-foreground">Help improve FormUp with usage data</p>
              </div>
              <Switch disabled defaultChecked />
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
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting || !userData}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export All Data
              </Button>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting} onClick={handleOpenDeleteDialog}>
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">⚠️ Delete Account Permanently</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <span className="block">
                        This action <strong>cannot be undone</strong>. This will permanently delete:
                      </span>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Your account and profile</li>
                        <li>All teams you own</li>
                        <li>All players in your teams</li>
                        <li>All assessment data</li>
                      </ul>
                      <span className="block pt-2">
                        To confirm, type <strong className="text-destructive">DELETE</strong> below:
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-2">
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="border-destructive/50 focus-visible:ring-destructive"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      I understand, delete my account
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
