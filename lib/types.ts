/**
 * Core data types for the FormUp application.
 * These types represent the shape of data as used in the application,
 * independent of the underlying storage backend.
 */

export interface Team {
  id: string;
  teamCode: string;
  name: string;
  evaluator: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber?: string;
  position?: string;
  age?: string; // Legacy field
  createdAt: number;
  updatedAt: number;
}

export interface PlayerWithAssessments extends Player {
  assessments: Assessment[];
}

export interface Assessment {
  id: string;
  playerId: string;
  teamId: string;
  date: string;
  evaluator: string;
  ratings: Record<string, number>;
  notes: Record<string, string>;
  overallRating: number;
  createdAt: number;
}

export interface CreateTeamInput {
  teamCode: string;
  name: string;
  evaluator: string;
}

export interface UpdateTeamInput {
  id: string;
  name: string;
  evaluator: string;
}

export interface CreatePlayerInput {
  teamId: string;
  name: string;
  jerseyNumber?: string;
  position?: string;
}

export interface UpdatePlayerInput {
  id: string;
  name?: string;
  jerseyNumber?: string;
  position?: string;
}

export interface CreateAssessmentInput {
  playerId: string;
  teamId: string;
  date: string;
  evaluator: string;
  ratings: Record<string, number>;
  notes: Record<string, string>;
  overallRating: number;
}

export interface UpdateAssessmentInput {
  id: string;
  date?: string;
  evaluator?: string;
  ratings?: Record<string, number>;
  notes?: Record<string, string>;
  overallRating?: number;
}
