"use client";

import { Suspense } from "react";
import { useConvexAuth } from "convex/react";
import TeamManager from "./TeamManager";
import { SignInForm } from "@/components/auth/SignInForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="text-xl text-slate-600">Loading...</div>
    </div>
  );
}

function AuthenticatedContent() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <SignInForm />;
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
