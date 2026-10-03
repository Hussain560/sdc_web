# Server Logic and Data Access

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Where does logic go? (decision matrix)

| If the logic is… | Put it in | Example |
| ---------------- | --------- | ------- |
| An integrity invariant that must hold no matter who writes | **DB constraint** (FK, UNIQUE, CHECK, exclusion) | One registration per user per event |
| "Who may read/write which rows" | **RLS policy** using `has_permission()` / ownership | Reviewers see registrations of their committee's events |
| A multi-row or multi-table state transition that must be atomic | **SQL function** (`security invoker` by default; `security definer` only with explicit checks and fixed `search_path`) | `decide_membership_application()` creates the member in the same transaction |
| Automatic bookkeeping on write | **Trigger** | `updated_at`, `published_at` set once, profile row on sign-up, audit rows, registration name/email snapshot |
| Read models for public pages or reports | **View** (`security_invoker = true`) or SQL function | `public_events`, `member_directory`, `committee_stats` |
| User-initiated mutation from the app UI | **Server Action** in the module → calls DB (direct or RPC) → side effects | `registerForEvent`, `submitEvent` |
| Machine-facing endpoint (webhook, cron, file download) | **Route Handler** → same module functions | Email provider webhook, CSV export |
| A side effect on an external system (email) | **Server module** after the DB commit | `notifications.send()` |
| Display formatting, interaction | **Component** | Date formatting, modal state |

**Edge Functions** are not part of the default toolbox. They may be introduced only via ADR for Supabase-native needs (e.g., an Auth hook). The existing `check-email-exists`, `send-registration-email`, `send-status-email` are retired (replaced by server-side email and Auth's own reset flow).

## 2. Supabase clients

| Client | Module | Key | Used by | RLS |
| ------ | ------ | --- | ------- | --- |
| Server (user) | `lib/supabase/server.ts` | anon/publishable key + user's cookie session | Server Components, Server Actions, Route Handlers | **Applies** (as the user) |
| Browser | `lib/supabase/browser.ts` | anon/publishable key | Only where realtime or direct client calls are justified (rare) | Applies |
| Proxy (Next.js 16 `proxy.ts`, formerly middleware) | `lib/supabase/proxy.ts` | anon key | Session refresh | — |
| Admin | `lib/supabase/admin.ts` (`import 'server-only'`) | **service role / secret key** | Narrow operations impossible as the user: Auth admin (invite/claim links), system jobs | **Bypassed** — every call must check permissions explicitly first and be audited |

Rule: application code uses the **user client by default**. Using the admin client requires a code comment stating why and a review approval.

## 3. Module anatomy

```text
modules/registrations/
├── schemas.ts     RegisterInput, DecideInput (zod)
├── queries.ts     getMyRegistration(eventId), listForEvent(eventId, filters)
├── actions.ts     'use server' — registerForEvent, cancelRegistration, decideRegistrations
├── types.ts       Registration, RegistrationStatus (from generated DB types)
└── components/    RegistrationButton, RegistrantsTable, DecisionDialog
```

A Server Action always follows the same skeleton:

1. **Authenticate** — get the verified user (reject if none).
2. **Validate** — parse input with Zod.
3. **Authorize (pre-check for UX)** — `can(user, 'registrations.review', { committeeId })`; the DB re-checks.
4. **Execute** — one DB call (direct statement or RPC) for the state change.
5. **Side effects** — send notifications (logged, idempotent).
6. **Revalidate** — `revalidateTag` / `revalidatePath` for affected public pages.
7. **Return** a typed result.

## 4. Validation

| Layer | What it checks |
| ----- | -------------- |
| Client (Zod, same schema) | Immediate field feedback — convenience only |
| Server Action (Zod) | Shape, types, lengths, enums, URL schemes (`https:` only), date ordering; rejects unknown keys |
| Database | Constraints, RLS, transition guards inside functions — authoritative |

Shared limits (Proposed): titles ≤ 200 chars; summaries ≤ 500; bodies ≤ 50,000; names ≤ 100; bios ≤ 1,000; URLs ≤ 500; notes ≤ 1,000.

## 5. Error handling

Server Actions and Route Handlers return a uniform result, aligned with the Innosoft API response convention (`success`, `code`, `message`, `data`):

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string; fieldErrors?: Record<string, string> };
```

| Postgres / Auth error | `ErrorCode` | User message (key) |
| --------------------- | ----------- | ------------------ |
| `42501` (RLS / insufficient privilege) | `FORBIDDEN` | `errors.forbidden` |
| `23505` (unique violation) | `ALREADY_EXISTS` (contextual: `ALREADY_REGISTERED`, `ALREADY_APPLIED`) | specific |
| `23503` (FK violation) | `NOT_FOUND` | `errors.notFound` |
| `23514` (check violation) / `P0001` raised by transition function with a code | the raised code (e.g., `REGISTRATION_CLOSED`, `INVALID_TRANSITION`, `CAPACITY_REACHED`) | specific |
| Validation failure | `VALIDATION_FAILED` + `fieldErrors` | per field |
| Unauthenticated | `UNAUTHENTICATED` | `errors.signInRequired` |
| Anything else | `INTERNAL` (details logged, never shown) | `errors.generic` |

Domain functions raise errors with a machine code in the message (`raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001'`), so the mapping is deterministic. Pages use `error.tsx` boundaries and `notFound()` for missing resources.

## 6. Logging

| Log | Content | Where |
| --- | ------- | ----- |
| Application log | JSON lines: level, module, action, user id (not email), request id, error code, duration | Vercel function logs |
| Audit log | Business actions (who did what to which entity, before/after summary) | `audit_logs` table |
| Email log | Every send attempt | `email_logs` table |

Never log passwords, tokens, full request bodies, emails of other users or meeting links.

## 7. Generated types

Database types are generated from the local schema (`supabase gen types typescript --local > src/lib/supabase/database.types.ts`) after every migration; CI fails if the committed file is stale.
