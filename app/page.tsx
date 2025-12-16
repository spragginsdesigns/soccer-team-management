"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TeamManager from "./TeamManager";
import { SignInForm } from "@/components/auth/SignInForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AuthenticatedContent() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const userProfile = useQuery(
    api.userProfiles.get,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    // If authenticated but no profile, redirect to onboarding
    if (isAuthenticated && userProfile === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, userProfile, router]);

  useEffect(() => {
    // Redirect based on role
    if (userProfile) {
      if (userProfile.role === "player") {
        router.replace("/player");
      } else if (userProfile.role === "parent") {
        router.replace("/parent");
      }
      // Coaches stay on this page
    }
  }, [userProfile, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <SignInForm />;
  }

  // Still loading profile
  if (userProfile === undefined) {
    return <LoadingSpinner />;
  }

  // Redirect in progress
  if (userProfile === null || userProfile.role !== "coach") {
    return <LoadingSpinner />;
  }

  return (
    <DashboardLayout>
      <TeamManager />
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthenticatedContent />
    </Suspense>
  );
}
