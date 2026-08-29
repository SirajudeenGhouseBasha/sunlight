# Sunlight — Agent Instructions

Single Next.js 15 app (phone-case e-commerce: catalog, custom design editor, cart/checkout, admin ERP). This file is at the repo root — run all commands here.

## Project structure

- Path alias `@/*` maps to the repo root, so `@/src/components/...` is correct (tsconfig + vitest both wired).
- App router in `src/app/`; shadcn/ui style `radix-nova` (`components.json`). Run `npx shadcn add <component>` to add new ones.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server on `0.0.0.0:3000` |
| `npm run build` | Production build (also runs TS typecheck; there is no separate typecheck script) |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest single run |
| `npm run test:watch` | Vitest watch |

- Single test: `npx vitest run <path>` (the only test today is `src/components/admin/shared/shared.test.tsx`).
- Lint downgrades several TS/React rules to `warn` (e.g. `no-explicit-any`, `no-unused-vars`, `exhaustive-deps`) — do not treat them as errors.
- `npm run analyze` sets `ANALYZE=true` but **next.config.ts never reads it** — the bundle analyzer is not wired up; it is a no-op.

## Auth — which file actually runs

- The **only** live auth middleware is `middleware.ts` at the repo root (route protection, role checks, inactive-user redirect, session refresh). Edit this file.
- `src/proxy.ts` is a **duplicate, dead implementation** — nothing imports it, and Next 15.5 runs `middleware.ts`, not `proxy.ts`. Changes there have no effect; prefer deleting it.
- The route matchers in `middleware.ts` (`publicRoutes`, `protectedRoutes`, `adminRoutes`, dynamic-route regex) are **hardcoded in that file** — add/remove routes there, not elsewhere. `src/lib/auth/config.ts` is only consulted for `userRoles` and `authRoutes.defaultRedirect`.

## Testing

- Vitest + jsdom; setup is `vitest.setup.ts` only (jest-dom). `src/test/setup.ts` loads dotenv from `.env.local` but is **not referenced by `vitest.config.ts`** — tests do not get env vars automatically.
- To add a `.tsx` test: `src/test/` or co-locate next to source.

## Auth & data

- **Supabase**: browser client is a singleton (`src/lib/supabase/client.ts`). Server client needs `await cookies()` (`src/lib/supabase/server.ts`). Two equivalent service-role clients exist (`src/lib/supabase/admin.ts` `createAdminClient` and `src/lib/supabase/service.ts` `createServiceClient`) — both bypass RLS, server-only, use `SUPABASE_SECRET_KEY`; service.ts exists for guest-order flows.
- **TanStack Query**: `src/lib/query-client.ts` — staleTime=5min, gcTime=10min, retry=3. Query keys/staleness in `src/lib/queries/config.ts` (per-type `STALE_TIME`/`GC_TIME`). See `docs/tanstack-query-setup.md`.
- **Zustand** (`src/stores/ui-store.ts`): UI-only state (modals, theme, sidebar, loading). Do not put server/API state here.
- **S3**: AWS SDK for image/file uploads via `src/lib/storage/` (s3.ts, images.ts). Public S3 URLs are signed through the `src/app/api/image-proxy/` route (see `src/utils/image-url.ts`).

## Style

- Tailwind CSS v4 (`@tailwindcss/postcss`) — CSS-first config: tokens live in `src/app/globals.css` (`@theme inline`), dark mode via `@custom-variant dark` + `.dark` class. `tailwind.config.ts` is vestigial and unused (no `@config` directive).
- Utility function `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge).
- SVG imports use `@svgr/webpack` (config in `next.config.ts`).
- Geist (sans), Geist Mono, Outfit (heading) fonts via `next/font/google` in `src/app/layout.tsx`.

## Env & infra

- `.env.local` is present and required. Keys (see `.env.example`): Supabase `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SECRET_KEY`/`SUPABASE_DB_PASSWORD`, AWS S3 creds (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `NEXT_PUBLIC_S3_BUCKET_URL`), `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_API_URL`, email `RESEND_API_KEY`/`EMAIL_FROM`.
- **Order emails** (Resend) live in `src/lib/email/service.ts`. Two senders:
  - `sendOrderStatusEmail` — customer notification on every status change (placed → `PENDING_PAYMENT`, payment verified → `PAID`, shipped → `SHIPPED` with tracking number, delivered → `DELIVERED`) to the order's `customer_email`. New status transitions must call it (see `api/admin/orders/route.ts`, `api/orders/[id]/route.ts`, `lib/orders/order-creator.ts`).
  - `sendAdminOrderNotification` — new-order alert to all admin emails (order-creator only).
  Both never throw; silently skip when `RESEND_API_KEY` is unset.
- Database migrations: `supabase/migrations/`, timestamp-prefixed SQL. Local config: `supabase/config.toml` (API 54321, DB 54322, Studio 54323). The Supabase CLI is linked to the remote project (`supabase/.temp/linked-project.json`, ref `bimolyuiboouvqgviztb`). **Normal workflow: add `<timestamp>_name.sql` to `supabase/migrations/`, then run `npx supabase db push`** (set `SUPABASE_DB_PASSWORD` in env or it will prompt for the remote DB password). `supabase migration repair --status applied <version>` is used to adopt pre-existing schema; `supabase db reset` only affects a local stack. Check remote-vs-local state with `npx supabase migration list` (queries the remote DB, needs the password too).
