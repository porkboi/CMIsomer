# Quick Debug Guide

Use this when the app fails locally or a feature stops behaving as expected.

## 1. App Will Not Start

- Confirm Node.js 18+ and `pnpm` are installed.
- Run `pnpm install` from the repo root.
- Make sure `.env.local` exists and includes:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 2. Supabase Errors

- If you see missing table or lookup failures, check that the party registration tables were created.
- Review `setup.sql` and the migration files under `migrations/`.
- Verify the party slug you are testing matches the table names generated from `lib/table-names.ts`.

## 3. Registration Price Looks Wrong

- Check the active tier data in Supabase `price_tiers`.
- Confirm the party row in `parties` has the expected `ticket_price`, `max_capacity`, and schedule settings.
- If a promo or AndrewID-based discount is active, the client and server both apply it in `components/registration-form.tsx` and `lib/actions.ts`.

## 4. Ticket or QR Issues

- Ticket rendering lives in `app/party/[slug]/ticket/page.tsx` and related ticket components.
- QR verification is handled by server actions in `lib/actions.ts`.
- If the QR scan path fails, check the registration table for the `confirmation_token`, `qr_code`, and `checked_in` fields.

## 5. Dashboard Data Looks Stale

- The dashboard reads counts, allocations, price tiers, and timeslot data from Supabase.
- Refresh the page after database changes.
- If the problem is isolated to counts, inspect `app/api/registrations/count/route.ts`.

## 6. Build Or Lint Problems

- Run `pnpm build` to catch production build issues.
- Run `pnpm lint` to catch style and routing issues.
- If a failure mentions a missing import or type, check recent edits in `components/` or `lib/`.
- There is no dedicated `pnpm test` suite currently, so lint/build are the default safety checks.

## Fast Isolation

1. Reproduce the issue in the smallest possible flow.
2. Check browser console and terminal output.
3. Inspect the matching page or action in `app/`, `components/`, or `lib/`.
4. Compare the code path with `docs/README.md` and the schema in `setup.sql`.
