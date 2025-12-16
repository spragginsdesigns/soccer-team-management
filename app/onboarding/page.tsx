"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const hasProfile = useQuery(api.userProfiles.hasCompletedOnboarding);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (hasProfile === true) {
      router.replace("/");
    }
  }, [hasProfile, router]);

  if (authLoading || hasProfile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (hasProfile) {
    return null;
  }

  return <RoleSelector onComplete={() => router.replace("/")} />;
}
