"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, User, Users } from "lucide-react";
import { toast } from "sonner";

type Role = "coach" | "player" | "parent";

interface RoleOption {
  role: Role;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    role: "coach",
    title: "Coach",
    description: "Create and manage teams, assess players",
    icon: <ClipboardList className="h-8 w-8" />,
    features: [
      "Create and manage multiple teams",
      "Add and assess players",
      "Invite other coaches",
      "Export reports",
    ],
  },
  {
    role: "player",
    title: "Player",
    description: "View your assessments and progress",
    icon: <User className="h-8 w-8" />,
    features: [
      "View your assessments",
      "Track your progress over time",
      "See skill breakdowns",
      "Set personal goals",
    ],
  },
  {
    role: "parent",
    title: "Parent",
    description: "Monitor your child's development",
    icon: <Users className="h-8 w-8" />,
    features: [
      "View your child's assessments",
      "Track their progress",
      "Stay informed on development",
      "Communicate with coaches",
    ],
  },
];

interface RoleSelectorProps {
  onComplete: () => void;
}

export function RoleSelector({ onComplete }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProfile = useMutation(api.userProfiles.create);

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({ role: selectedRole });
      toast.success("Profile created successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to TeamPro</h1>
          <p className="text-muted-foreground">
            Select your role to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roleOptions.map((option) => (
            <Card
              key={option.role}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === option.role
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedRole(option.role)}
            >
              <CardHeader className="text-center pb-2">
                <div
                  className={`mx-auto mb-3 p-4 rounded-full ${
                    selectedRole === option.role
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {option.icon}
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="px-12"
          >
            {isSubmitting ? "Setting up..." : "Continue"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            You can change this later in your settings
          </p>
        </div>
      </div>
    </div>
  );
}
