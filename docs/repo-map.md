# Repo Map (Actionable)

## Key App Flows

1. Party creation
- Route: `app/create/page.tsx` -> `app/create/create-party/page.tsx`
- Core action: `lib/actions.ts#createParty`
- DB side effects: writes `parties`, creates `registrations_{slug}` table, seeds `price_tiers`.

2. Public registration
- Route: `app/party/[slug]/page.tsx`
- UI: `components/registration-form.tsx`
- Core actions: `getPriceTiers`, `submitRegistration`, `redeemPromoCode`, `submitDatingEntry`.

3. Ticket retrieval and QR
- Route: `app/party/[slug]/ticket/page.tsx`
- Components: `components/ticket-qr.tsx`, `components/ticket-match-live-host.tsx`
- Core actions: token lookup and QR verification in `lib/actions.ts`.

4. Organizer dashboard
- Main UI: `components/dashboard.tsx`
- Data/actions: `getRegistrations`, `getOrgAllocation`, tier updates, waitlist actions, check-in flows.

5. Registration counts API
- Endpoint: `app/api/registrations/count/route.ts`
- Used by registration UI for capacity/tier behavior.

## Core Modules

- `lib/actions.ts`: central server action layer; highest coupling and risk.
- `components/registration-form.tsx`: pricing, promo/AndrewID discount UX, submission payload.
- `components/dashboard.tsx`: admin-heavy logic and mutating operations.
- `lib/table-names.ts`: dynamic table naming; critical for party-scoped data.
- `lib/supabase.ts` + `lib/db-client.ts`: DB client plumbing.
- `setup.sql` + `migrations/*`: schema and table lifecycle.

## Current Validation/Testing Commands

- Install deps: `pnpm install`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Dev server: `pnpm dev`

Notes:
- No dedicated unit/integration test suite is configured in `package.json`.
- `pnpm lint` currently fails on pre-existing repo issues.
- `pnpm build` currently fails with a generic webpack failure message (no detailed stack emitted in this environment).

## Top 8 Cleanup Opportunities

1. Reduce `any` usage in high-traffic components
- Files: `components/dashboard.tsx`, `components/registration-form.tsx`, `app/party/[slug]/page.tsx`, `lib/db-client.ts`
- Risk: Medium
- Why: Type gaps hide regressions in pricing/registration flows.

2. Remove unused variables/imports repo-wide
- Files: multiple (`lib/actions.ts`, `components/login-form.tsx`, `pages/api/parties/[slug]/redeem-promo.ts`, etc.)
- Risk: Low
- Why: Cuts lint noise and makes real issues visible.

3. Break up `lib/actions.ts`
- File: `lib/actions.ts`
- Risk: Medium-High
- Why: Overloaded file mixes party lifecycle, registration, QR, promo, auth-like checks.

4. Isolate pricing logic into shared pure helpers
- Files: `components/registration-form.tsx`, `lib/actions.ts`
- Risk: Medium
- Why: Client and server pricing logic can drift.

5. Add explicit `Registration`/`PriceTier` DTOs for UI-server boundaries
- Files: `lib/types.ts`, `lib/actions.ts`, `components/*`
- Risk: Medium
- Why: Prevents silent shape mismatches in form submission/editing.

6. Normalize promo/discount naming and payloads
- Files: `components/registration-form.tsx`, `lib/actions.ts`
- Risk: Low-Medium
- Why: `appliedPromoCode` and `appliedAndrewIDCode` are correct but fragile without shared types.

7. Improve build diagnostics
- Files: `next.config.mjs`, project scripts
- Risk: Low
- Why: Current build failure output is opaque; hard to triage quickly.

8. Add smoke tests for critical paths
- Scope: registration submit, promo apply, ticket retrieval, dashboard load
- Risk: Medium (initial setup), High payoff
- Why: No automated tests currently guard core business flows.
