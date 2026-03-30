# MVP Improvement Batch Design

## Goal

Improve the project's MVP quality in one focused batch by addressing the highest-leverage issues identified during repository analysis:

1. Consolidate backend behavior around the TypeScript server runtime.
2. Replace hardcoded dashboard content with API-backed data plus safe fallbacks.
3. Restore trust in the server test suite by fixing currently failing tests and implementation mismatches.

## Scope

### In Scope

- Reduce backend route duplication and ambiguity in the active TypeScript runtime.
- Treat `server/src/index.ts` as the primary backend entrypoint for current behavior.
- Keep legacy files intact unless a change is necessary to prevent confusion or breakage.
- Add dashboard data loading using existing frontend utilities and current API shape where practical.
- Preserve the current dashboard layout while improving realism and resilience.
- Fix failing server tests uncovered during analysis.
- Re-run targeted and broader verification before completion.

### Out of Scope

- Full removal of every legacy JavaScript backend file.
- Full TypeScript strict-mode migration across the backend.
- Major frontend redesign.
- Large-scale architectural refactors beyond the touched paths.

## Current Problems

### Backend

- The repository contains parallel JavaScript and TypeScript backend implementations.
- The active TypeScript server mounts overlapping routes and aliases, which makes behavior harder to reason about.
- The codebase signals migration intent but still contains duplicated paths for similar features.

### Frontend

- The main dashboard currently renders hardcoded portfolio, stock, and AI insight data.
- The dashboard experience looks polished but does not yet prove live product value during demos.

### Reliability

- The server test suite mostly passes, but a small number of failures indicate behavior drift between tests and implementation.
- Coverage thresholds are configured aggressively, but actual coverage is far below the configured target.

## Approach Options

### Option 1: Minimal Stabilization

Fix failing tests and remove the most obvious duplicate routes only.

Pros:
- Lowest change risk.
- Fastest turnaround.

Cons:
- Little visible user-facing improvement.
- Dashboard remains demo-oriented rather than product-oriented.

### Option 2: Focused MVP Improvement Batch

Stabilize the TypeScript backend runtime, wire the dashboard to live data with fallbacks, and fix the failing tests.

Pros:
- Best balance of product impact and implementation safety.
- Improves both demo quality and engineering confidence.
- Small enough to complete in one implementation cycle.

Cons:
- Leaves broader JS-to-TS cleanup for later.

### Option 3: Full Runtime Unification Pass

Attempt to eliminate most legacy overlap immediately and tighten TypeScript enforcement at the same time.

Pros:
- Strong long-term cleanup.

Cons:
- Higher regression risk.
- Too large for a focused MVP-quality batch.

## Recommendation

Choose Option 2.

This batch addresses the biggest quality gaps without overreaching. It improves what users see, reduces backend ambiguity in the currently active runtime, and restores confidence in automated verification.

## Design

### Backend Runtime Consolidation

- Keep `server/src/index.ts` as the source of truth for runtime behavior.
- Remove or reduce overlapping route mounts that duplicate the same feature under multiple near-identical prefixes unless they are clearly required for compatibility.
- Prefer one canonical versioned route path per feature in the active runtime.
- Leave legacy JavaScript modules in place when removing them would expand scope unnecessarily.

### Dashboard Data Wiring

- Replace dashboard hardcoded arrays with data fetched from backend endpoints or existing data utilities.
- Keep the current visual structure so the change is behavioral, not a redesign.
- Use loading and fallback states to avoid breaking the page if an endpoint is unavailable.
- Allow partial rendering so one failed data section does not blank the full dashboard.

### Test Stabilization

- Follow TDD for each behavior change:
  - update or add the failing test first,
  - verify the expected failure,
  - implement the minimum fix,
  - rerun the relevant test.
- Fix mismatches around financial data retrieval and final financial answer responses first because they are already failing.
- Rerun the server test suite after targeted fixes.

## Data Flow

### Dashboard

1. Dashboard page loads.
2. Frontend requests dashboard-relevant backend data through the existing API client or a small page-local fetch layer.
3. Each section maps API data into the current card/chart/list UI.
4. If data is unavailable, the section falls back to safe placeholder copy rather than crashing.

### Backend

1. Requests enter through canonical TypeScript routes.
2. Middleware remains unchanged unless a touched route needs adjustment.
3. Services continue to supply the underlying business logic.

## Error Handling

- Keep dashboard failures isolated per section.
- Return sensible empty states for missing market or portfolio data.
- Avoid introducing stricter runtime behavior that would break existing clients unless tests or current code prove it is necessary.

## Testing Strategy

- Add or adjust focused tests for any changed backend behavior.
- Run targeted tests for modified services first.
- Run the broader server test suite after the focused fixes.
- If frontend changes are not covered by an existing test setup, verify them through build-safe code paths and static inspection.

## Success Criteria

- The TypeScript backend runtime has fewer overlapping route registrations for the touched features.
- The dashboard no longer depends entirely on hardcoded content for its primary metrics and feed sections.
- Previously failing backend tests are green.
- Verification commands clearly show the new state of the project.
