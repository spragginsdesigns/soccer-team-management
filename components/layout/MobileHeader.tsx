"use client";

import { Menu, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-sidebar-foreground hover:bg-sidebar-accent/20"
      >
        <Menu className="h-6 w-6" />
      </Button>
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold text-foreground">FormUp</span>
      </div>
    </header>
  );
}
