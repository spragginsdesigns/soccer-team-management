# FormUp Optimization Audit Report

## Executive Summary

FormUp is a Next.js 15.1.3 soccer team assessment app using Convex as a cloud backend. The architecture is more scalable than initially expected (uses Convex, not localStorage for data). Key opportunities exist for DRY improvements, type safety, and future multi-tenant scaling.

---

## Current Architecture Summary

### Tech Stack
- **Framework:** Next.js 15.1.3 (App Router)
- **React:** 19.0.0
- **Database:** Convex (cloud real-time database)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** Client-side via Convex hooks (useQuery, useMutation)

### Routing Structure
```
app/
├── page.tsx                          # Home (wraps TeamManager)
├── TeamManager.tsx                   # Main roster management (client)
├── assessment/[playerId]/page.tsx   # Create assessment (client)
├── assessment-details/[assessmentId]/page.tsx  # View assessment (client)
├── layout.tsx                        # Root layout (server)
└── ConvexClientProvider.tsx          # Convex React provider
```

### Data Model (Convex)
```
teams
├── teamCode: string (indexed, unique)
├── name: string
├── evaluator: string
├── userId?: string (future auth)
├── createdAt, updatedAt: number

players
├── teamId: Id<"teams"> (indexed)
├── name: string
├── jerseyNumber?: string
├── position?: string
├── age?: string (legacy)
├── createdAt, updatedAt: number

assessments
├── playerId: Id<"players"> (indexed)
├── teamId: Id<"teams"> (indexed)
├── date: string
├── evaluator: string
├── ratings: any          ← TYPE SAFETY ISSUE
├── notes: any            ← TYPE SAFETY ISSUE
├── overallRating: number
├── createdAt: number
```

### Data Flow
1. Team code from URL param `?team=CODE` or localStorage cache
2. Convex queries fetch team → players → assessments
3. All data mutations go through Convex mutations
4. Real-time sync via Convex subscriptions

---

## Top 5 Bottlenecks/Risks

### 1. Duplicated Assessment Schema (HIGH)
**Location:**
- `app/assessment/[playerId]/page.tsx:11-56`
- `app/assessment-details/[assessmentId]/page.tsx:13-58`

**Issue:** Categories and skills array is copy-pasted. Any schema change requires updating both files.

**Risk:** Schema drift, maintenance burden, inconsistent behavior.

### 2. Duplicated Helper Functions (MEDIUM)
**Location:** Both assessment pages

**Duplicated functions:**
- `getRatingColor(rating: number)`
- `getRatingLabel(rating: number)`
- `calculateCategoryAverage(category)`

**Risk:** Bug fixes must be applied twice; inconsistent behavior.

### 3. No Type Safety on Ratings/Notes (MEDIUM)
**Location:** `convex/schema.ts:32-33`

**Issue:** Uses `v.any()` for ratings and notes maps. No compile-time or runtime validation.

**Risk:** Corrupt data can silently enter the system; hard to debug.

### 4. All Pages Are Client Components (LOW)
**Location:** All page.tsx files have `"use client"`

**Issue:** Entire pages are client-rendered, increasing First Load JS.

**Impact:** Currently acceptable (~141-169 kB per route). Could be optimized later.

### 5. Minimal Print Optimization (LOW)
**Location:** `app/globals.css:5-9`

**Issue:** Only `.no-print { display: none }` rule exists. No spacing, page breaks, or print-specific styling.

---

## Change Classification

### Quick Wins (1-2 hours)
1. **Extract assessment schema to lib/assessmentSchema.ts**
   - Single source of truth for categories, skills, rating labels
   - Both pages import from shared module
   - Impact: Eliminates duplication, enables future schema versioning

2. **Extract rating helpers to lib/assessmentUtils.ts**
   - Pure functions for `getRatingColor`, `getRatingLabel`, `calculateCategoryAverage`
   - Impact: DRY, testable, consistent

3. **Add print CSS improvements**
   - Better spacing, page breaks, hide backgrounds for PDF
   - Impact: Clean print output

### Medium Changes (half day)
4. **Create DataClient abstraction**
   - Interface-based data access layer
   - ConvexClient implements the interface
   - Future: PostgresClient, MockClient for testing
   - Impact: Backend portability, testability

5. **Add Zod validation for assessment payloads**
   - Validate ratings/notes structure before save
   - Graceful handling of corrupt data on read
   - Impact: Data integrity, error resilience

### Longer Changes (multi-day)
6. **Convert pages to server components where possible**
   - Keep only interactive pieces as client components
   - Dynamic imports for optional heavy UI
   - Impact: Reduced client bundle, faster TTI

7. **Multi-tenant preparation**
   - Add clubId/seasonId scoping
   - Route segment for team context
   - Database migration path documentation

---

## Proposed Step-by-Step Refactor Plan

### Phase 1: Data-Driven Schema (This PR)
1. Create `lib/assessmentSchema.ts` with categories, skills, and rating config
2. Create `lib/assessmentUtils.ts` with helper functions
3. Update both assessment pages to use shared imports
4. Verify: `pnpm lint && pnpm build`, manual test

### Phase 2: Data Layer Abstraction (This PR)
1. Define `DataClient` interface in `lib/dataClient.ts`
2. Implement `ConvexDataClient` using existing Convex queries/mutations
3. Document future backend migration path
4. Verify: `pnpm lint && pnpm build`, manual test

### Phase 3: Validation (Future PR)
1. Add Zod schemas for Assessment type
2. Validate on save, sanitize on read
3. Handle corrupt data gracefully with warnings

### Phase 4: Print Optimization (Future PR)
1. Add comprehensive print CSS
2. Optimize assessment details for PDF export

### Phase 5: Bundle Optimization (Future PR)
1. Analyze with `@next/bundle-analyzer`
2. Convert server components where beneficial
3. Dynamic imports for optional features

---

## Current Build Metrics

```
Route (app)                              Size     First Load JS
┌ ○ /                                    18.2 kB         169 kB
├ ○ /_not-found                          978 B           106 kB
├ ƒ /assessment-details/[assessmentId]   2.94 kB         141 kB
└ ƒ /assessment/[playerId]               2.47 kB         143 kB
+ First Load JS shared by all            105 kB
```

Lint: ✅ No warnings or errors
Build: ✅ Successful

---

## Next Steps Checklist (Post This PR)

- [ ] Add Zod validation for assessment data
- [ ] Enhance print CSS for clean PDF output
- [ ] Consider server component conversion for static parts
- [ ] Document Postgres migration path (Prisma/Drizzle)
- [ ] Add multi-tenant clubId scoping when needed
- [ ] Add integration tests using MockDataClient
