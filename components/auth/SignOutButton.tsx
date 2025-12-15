"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export function SignOutButton({
  variant = "ghost",
  size = "sm",
  showIcon = true,
  showText = true,
  className,
}: SignOutButtonProps) {
  const { signOut } = useAuthActions();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => void signOut()}
      className={className}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {showText && <span className={showIcon ? "ml-2" : ""}>Sign Out</span>}
    </Button>
  );
}
