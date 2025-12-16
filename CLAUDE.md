# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FormUp is a soccer team management web app for tracking player development and assessments. Built with Next.js 15 (App Router), Convex for the backend/database, and Tailwind CSS. Supports multi-team access with role-based permissions (coach/player/parent).

## Commands

```bash
pnpm dev          # Start Next.js dev server (runs on localhost:3000)
npx convex dev    # Start Convex backend (run in separate terminal)
pnpm build        # Production build
pnpm lint         # Run ESLint
```

## Architecture

### Frontend (Next.js App Router)

- `app/` - Page routes using App Router
  - `page.tsx` - Main dashboard/team roster
  - `assessment/[playerId]/` - Create new assessment for a player
  - `assessment-details/[assessmentId]/` - View/edit existing assessment
  - `teams/` - Team management
  - `player/`, `parent/` - Role-specific views
  - `onboarding/` - Initial role selection flow
  - `settings/` - User preferences
- `components/` - React components
  - `ui/` - shadcn/ui primitives (Button, Card, Dialog, etc.)
  - `layout/` - DashboardLayout, Sidebar, MobileHeader
  - `auth/` - SignInForm, SignOutButton
  - `team/` - JoinTeamDialog, TeamMembersCard
- `lib/` - Shared utilities
  - `assessmentSchema.ts` - **Single source of truth** for assessment categories, skills, and rating levels
  - `types.ts` - Core TypeScript interfaces (Team, Player, Assessment)
  - `utils.ts` - cn() helper for Tailwind class merging

### Backend (Convex)

- `convex/schema.ts` - Database schema with tables: teams, players, assessments, teamMembers, userProfiles, joinAttempts
- `convex/lib/access.ts` - Authentication and authorization helpers (verifyTeamAccess, verifyTeamModifyAccess, verifyTeamOwner)
- Query/mutation files: `players.ts`, `teams.ts`, `assessments.ts`, `teamMembers.ts`, `users.ts`, `userProfiles.ts`

### Key Patterns

**Authentication**: Uses `@convex-dev/auth` with email/password. Auth state flows through `ConvexClientProvider`.

**Team Access Control**: Three-tier membership system:
- `owner` - Full control, can manage members
- `coach` - Can modify players/assessments
- `viewer` - Read-only access

**Assessment Data**: Ratings stored as `Record<string, number>` using legacy key format: `"{Category Name}-{Skill Name}"`. Always use `getLegacyRatingKey()` from `lib/assessmentSchema.ts` for consistency.

**Type Aliases**: Use `@/*` path alias (maps to project root).

## Database Schema (Convex)

- `teams` - Team info with `inviteCode` for joining
- `players` - Linked to team by `teamId`
- `assessments` - Linked to player and team, contains ratings/notes maps
- `teamMembers` - Junction table for multi-coach access
- `userProfiles` - User role (coach/player/parent)
- `joinAttempts` - Rate limiting for team join attempts

## Important Conventions

- Assessment categories/skills are defined in `lib/assessmentSchema.ts` - modify there to add/change skills
- All Convex queries requiring team access should use helpers from `convex/lib/access.ts`
- UI components use shadcn/ui patterns with Tailwind + CVA for variants
- Dark theme is forced via ThemeProvider (no light mode toggle)

## Architecture Principles

### Single Responsibility & Composition

- Each component/hook/util has one clear job; if you can't describe it in one short sentence, split it.
- When naming new files, check first if similar names exist (`fd <name>` or `rg "export.*<Name>"`).
- Co-locate by feature: `feature/hooks`, `feature/utils`, `feature/types.ts`, `feature/components`.
- Pure logic → `utils/`; stateful logic → `hooks/`; UI → components that take props.
- For any page/feature with 200+ lines, extract into: `types.ts`, `constants.ts`, `utils.ts`, `components/` (with barrel `index.ts`). Main file orchestrates only.
- Keep files understandable in isolation; avoid deep prop drilling—use composition/context.

### File Size Limits (Hard Rules)

| Type | Target | Max | Action |
|------|--------|-----|--------|
| Component | <150 | 250 | Extract sub-components |
| Hook | <100 | 150 | Split responsibilities |
| Util file | <100 | 150 | Split by category |

### Refactor Triggers (Any = Refactor Now)

- Mixes UI, state, and side effects in one file.
- Needs heavy mocking to test.
- Imports from many unrelated parts of the app.
- Has 5+ boolean props (`hide*`, `show*`, `disable*`).

## Naming & Code Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| React component | PascalCase | `PlayerCard.tsx` |
| Hook | camelCase + `use` | `useAssessments.ts` |
| Util (TS) | camelCase | `formatRating.ts` |
| Types | camelCase | `player.types.ts` |
| Test | source + `.test` | `PlayerCard.test.tsx` |

### Variable Naming

- **TypeScript**: camelCase for vars/functions, PascalCase for components/types, SCREAMING_SNAKE for constants
- **Booleans**: is/has/can prefix (`isLoading`, `hasError`, `canSubmit`)

### Import Organization (In Order, Blank Lines Between Groups)

1. External libraries (`react`, `next`, npm packages)
2. Internal absolute (`@/components`, `@/hooks`, `@/utils`)
3. Relative imports (same feature/directory)
4. Types (with `type` keyword)

### Exports

- Prefer named exports over default exports (easier to trace/refactor).
- Use barrel files (`index.ts`) for feature directories.
- Exception: Next.js pages/layouts require default exports.

### Anti-Patterns to Avoid

- **Utils black hole**: One giant `utils.ts` → split by category (`formatters/`, `validators/`, `calculations/`).
- **God components**: 500+ lines doing everything → compose from focused pieces.
- **Prop drilling**: Props through 3+ levels → use context or composition.
- **Boolean flag explosion**: 5+ boolean props → use variants or compound components.
