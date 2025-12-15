/**
 * DataClient Interface - Abstraction for data operations.
 *
 * This interface defines the contract for data access in the FormUp application.
 * The current implementation uses Convex (ConvexDataClient), but this interface
 * allows for future migration to other backends (Postgres, Supabase, etc).
 *
 * ## Current Implementation
 *
 * The app uses Convex React hooks directly in components:
 * - `useQuery(api.teams.getByTeamCode, { teamCode })`
 * - `useMutation(api.assessments.create)`
 *
 * This pattern provides real-time updates and optimistic UI.
 *
 * ## Migration Path
 *
 * To migrate to a different backend:
 *
 * 1. Implement the DataClient interface for the new backend
 * 2. Create React hooks that wrap the DataClient methods
 * 3. Replace Convex hooks with the new hooks in components
 *
 * Example for Postgres with Prisma:
 * ```typescript
 * class PrismaDataClient implements DataClient {
 *   async getTeamByCode(teamCode: string): Promise<Team | null> {
 *     return prisma.team.findUnique({ where: { teamCode } });
 *   }
 * }
 * ```
 */

import type {
  Team,
  Player,
  PlayerWithAssessments,
  Assessment,
  CreateTeamInput,
  UpdateTeamInput,
  CreatePlayerInput,
  UpdatePlayerInput,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from "./types";

export interface DataClient {
  // Team operations
  getTeamByCode(teamCode: string): Promise<Team | null>;
  getTeamById(teamId: string): Promise<Team | null>;
  createTeam(input: CreateTeamInput): Promise<string>;
  updateTeam(input: UpdateTeamInput): Promise<string>;
  deleteTeam(teamId: string): Promise<void>;

  // Player operations
  getPlayersByTeam(teamId: string): Promise<PlayerWithAssessments[]>;
  getPlayerById(playerId: string): Promise<PlayerWithAssessments | null>;
  createPlayer(input: CreatePlayerInput): Promise<string>;
  updatePlayer(input: UpdatePlayerInput): Promise<string>;
  deletePlayer(playerId: string): Promise<void>;

  // Assessment operations
  getAssessmentById(assessmentId: string): Promise<Assessment | null>;
  getAssessmentsByPlayer(playerId: string): Promise<Assessment[]>;
  getAssessmentsByTeam(teamId: string): Promise<Assessment[]>;
  createAssessment(input: CreateAssessmentInput): Promise<string>;
  updateAssessment(input: UpdateAssessmentInput): Promise<string>;
  deleteAssessment(assessmentId: string): Promise<void>;
}

/**
 * ConvexDataClient - Convex implementation notes
 *
 * The current app uses Convex React hooks which provide:
 * - Real-time subscriptions (data updates automatically)
 * - Optimistic updates
 * - Offline support
 *
 * The Convex queries/mutations are defined in `/convex/` directory:
 * - teams.ts: Team CRUD operations
 * - players.ts: Player CRUD with assessments
 * - assessments.ts: Assessment CRUD
 *
 * To use Convex in components:
 * ```typescript
 * import { useQuery, useMutation } from "convex/react";
 * import { api } from "@/convex/_generated/api";
 *
 * const team = useQuery(api.teams.getByTeamCode, { teamCode });
 * const createTeam = useMutation(api.teams.create);
 * ```
 */

/**
 * Helper to convert Convex document ID to string for type consistency.
 * Convex uses branded Id types, but our interface uses plain strings.
 */
export function toId(convexId: unknown): string {
  return String(convexId);
}

/**
 * Future: MockDataClient for testing
 *
 * ```typescript
 * class MockDataClient implements DataClient {
 *   private teams: Map<string, Team> = new Map();
 *   private players: Map<string, PlayerWithAssessments> = new Map();
 *   private assessments: Map<string, Assessment> = new Map();
 *
 *   // Implement interface methods with in-memory storage
 * }
 * ```
 */
