"use client";

import { Suspense } from "react";
import { useConvexAuth } from "convex/react";
import TeamManager from "./TeamManager";
import { SignInForm } from "@/components/auth/SignInForm";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading...</div>
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

  return <TeamManager />;
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthenticatedContent />
    </Suspense>
  );
}
