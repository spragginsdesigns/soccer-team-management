"use client";

import { Suspense } from "react";
import TeamManager from "./TeamManager";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-xl">Loading...</div></div>}>
      <TeamManager />
    </Suspense>
  );
}
