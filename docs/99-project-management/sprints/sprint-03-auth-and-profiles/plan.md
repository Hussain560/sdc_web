# Sprint 03 — Authentication & Profiles

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 03 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2026-11-08 |
| **End Date**        | 2026-11-21 |
| **Phase / Milestone** | Phase 2 — Identity & Access / M2 |
| **Target version**  | contributes to `v0.3.0` |
| **Capacity**        | ~25 SP — planned 36 SP after adding stories (AUTH-006…008, SEC-007, TEST-001): treat AUTH-006/008 as stretch, re-forecast after the first week |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ✅ Local scope complete 2026-10-02 — remaining: provider SMTP (Q-010/Q-017), staging deploy, demo |

## Read First (reference pack)

| Topic | Document | What to take from it |
| ----- | -------- | -------------------- |
| Module spec | [Authentication module](../../../11-modules/authentication/README.md) | Rules AU-1…AU-9, flows, server operations and error codes, edge cases, test list |
| Security design | [Authentication](../../../06-security/authentication.md) | Cookie sessions, `getUser()` on the server, route protection, `config.toml` auth settings |
| Data | [Identity and access entities §1](../../../05-database/entities/identity-and-access.md#1-profiles), [RLS model](../../../05-database/rls-security-model.md) | `profiles` columns, trigger, RLS and grants baseline |
| Screens | [Public 09 — auth pages](../../../10-design-system/PUBLIC-SCREENS/09-auth-pages.md), [Internal 11 — account area](../../../10-design-system/INTERNAL-SCREENS/11-account-area.md) | Exact look to keep; target states and copy |
| Business | [Business rules](../../../03-business-domain/business-rules.md) (BR-MBR-001 account ≠ membership), [Business processes](../../../03-business-domain/business-processes.md), [Notification rules](../../../03-business-domain/notification-rules.md) | Why registration is not membership; e-mail triggers `auth.*` |
| Requirements | [Functional requirements](../../../02-requirements/functional-requirements.md) FR-AUTH-001…010, [NFR](../../../02-requirements/non-functional-requirements.md) (NFR-SEC) | Acceptance traceability |
| Engineering | [Server logic and data access](../../../04-architecture/server-logic-and-data-access.md) (action skeleton, `Result`, error mapping), [Testing strategy](../../../09-quality/testing-strategy.md), [ADR-001](../../../90-decisions/README.md), [ADR-010](../../../90-decisions/ADR-010-i18n-routing.md) | Pattern every action follows |
| Notifications | [Notifications module §9](../../../11-modules/notifications/README.md#9-template-catalogue), [e-mail architecture](../../../04-architecture/email-architecture.md) | Template catalogue and provider (Q-010) |
| Privacy | [Data protection and privacy](../../../06-security/data-protection-and-privacy.md) | Account deletion, retention (Q-031) |

## Sprint Objective

Sign-up, sign-in, sign-out and password reset run on the server with cookie sessions; every account has a `profiles` row; the e-mail-existence oracle is gone; auth e-mails come from the community provider with bilingual templates. The auth pages keep their exact look.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| AUTH-005 | `profiles` table + sign-up trigger + backfill for existing users | P0 | 3 | — | ✅ Done 2026-10-02 (pgTAP 11 tests) |
| AUTH-001 | Sign-up with server-validated name/password and a branded confirmation e-mail | P0 | 5 | — | ✅ Done 2026-10-02 |
| AUTH-002 | Sign in and return to the page I came from (`?redirect=` same-site only) | P0 | 3 | — | ✅ Done 2026-10-02 |
| AUTH-003 | Reset password without revealing whether an e-mail exists | P0 | 3 | — | ✅ Done 2026-10-02 |
| AUTH-004 | Edit my name and language preference (`/account/profile`) | P1 | 3 | — | ✅ Done 2026-10-02 |
| NOT-001 | Auth e-mails through the provider custom SMTP; bilingual templates ⛔ Q-010, Q-017 | P0 | 5 | — | 🔄 Bilingual branded templates + Mailpit done; provider SMTP waits for Q-010/Q-017 |
| SEC-006 | Delete the `check-email-exists` Edge Function | P0 | 1 | — | ✅ Done 2026-10-02 (deleted from repo; remote copy goes with the deferred Supabase check) |
| AUTH-006 | Account area: `/account` overview and `/account/security` (change password, change e-mail) | P1 | 3 | — | ✅ Done 2026-10-02 |
| AUTH-007 | Header session UI driven by the server cookie session (no client-only truth); logout through a Server Action | P0 | 2 | — | ✅ Done 2026-10-02 |
| AUTH-008 | Resend confirmation (same response always) and Auth rate-limit configuration | P1 | 2 | — | ✅ Done 2026-10-02 (resend on the login error; local limit 30 mails/h, hosted limits to set with the provider) |
| SEC-007 | `sanitizeRedirect()` with a table-driven test; open-redirect and e-mail-oracle E2E checks | P0 | 2 | — | ✅ Done 2026-10-02 (26 unit cases + 4 E2E) |
| TEST-001 | Auth E2E on the local stack: sign-up → Mailpit → confirm → return path (ar + en), reset flow, protected-route redirect | P0 | 3 | — | ✅ Done 2026-10-02 (`npm run e2e:auth`, 21 tests) |
| AUTH-009 | Account deletion request — **moved to Sprint 04** (needs `audit_logs`, ACC-005) | P2 | 2 | — | ⏭ Moved |

## Technical Tasks

1. **SSR clients** — `src/lib/supabase/{server,browser,proxy}.ts` with `@supabase/ssr`; `proxy.ts` refreshes sessions.
2. **Server actions** — `modules/auth/actions.ts` with Zod schemas shared with the forms; localized error mapping.
3. **Callback** — `/auth/confirm` route (token-hash flow).
4. **Profiles** — migration + RLS (owner reads/updates limited columns) + pgTAP.
5. **UI** — same markup and CSS as today ([09-auth-pages](../../../10-design-system/PUBLIC-SCREENS/09-auth-pages.md)); the register copy states that an account is not membership (D-001).
6. **E-mail** — provider SMTP in `config.toml` (Mailpit locally) and in the hosted projects; templates in `supabase/templates/`.

7. **Proxy composition** — root `proxy.ts` runs the locale middleware first, then refreshes the Supabase session on the same response; it makes **no network call when there is no auth cookie** (keeps static public pages fast). `/auth/*` is excluded from the locale matcher.
8. **Client session** — `AuthContext` becomes a thin read-only client hook (user, `isLoggedIn`, `logout()` that calls the Server Action); the sign-in/sign-up/reset logic moves to Server Actions. Public pages stay statically rendered (decision: no per-request cookie read in the root layout).
9. **Result type** — `src/lib/result.ts` (`Result<T>`, `ErrorCode`) as in [server logic §5](../../../04-architecture/server-logic-and-data-access.md#5-error-handling); every action returns it.
10. **Auth E2E** — `playwright.auth.config.ts` runs against the local Supabase stack (real Auth, Mailpit API at `:54324`); separate from the mocked visual suite.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Story Details and Acceptance Criteria

| Story | Given / When / Then | Rules | Traces to |
| ----- | ------------------- | ----- | --------- |
| AUTH-005 | *Given* an existing `auth.users` row without a profile, *when* the migration runs twice, *then* exactly one profile exists per user and the second run changes nothing. *Given* a new sign-up, *then* the trigger creates a profile with the Arabic name, `preferred_locale` and lowercase e-mail | AU-7 | FR-AUTH-007 |
| AUTH-001 | *Given* a visitor, *when* they submit a name of fewer than 3 words or a weak password, *then* the server rejects it with field errors in the active language (client shows the same message). *Given* a valid form, *then* the card says "check your e-mail" and an `auth.confirm_signup` e-mail reaches Mailpit | AU-1, AU-2, AU-3, AU-9 | FR-AUTH-001/002/003 |
| AUTH-002 | *Given* `/login?redirect=/events/3`, *when* the credentials are right, *then* the user lands on `/events/3` (locale kept). *Given* `redirect=//evil.example` or `https://…`, *then* they land on the home page | AU-4 | FR-AUTH-004 |
| AUTH-003 | *Given* two e-mails (one registered, one not), *when* a reset is requested for each, *then* the responses are byte-identical in text and status | AU-5 | FR-AUTH-005 |
| AUTH-004 | *Given* a signed-in user, *when* they save a valid name and language, *then* the header name and the e-mail language change; they cannot change `email` or `id` (RLS + column grants) | AU-7 | FR-AUTH-008 |
| AUTH-006 | *Given* a signed-in user, *when* they change the password with a weak value, *then* `WEAK_PASSWORD`; with the same password, `SAME_PASSWORD`; success signs out other sessions | AU-2 | FR-AUTH-008 |
| AUTH-007 | *Given* a signed-in visitor, *when* they reload any public page, *then* the header shows their name from the cookie session; *when* they log out, *then* the cookie is cleared server-side and `/account` redirects to login | AU-6 | FR-AUTH-006/010 |
| AUTH-008 | *Given* an unconfirmed e-mail, *when* the user taps Resend, *then* the response is identical for unknown e-mails | AU-5, AU-8 | FR-AUTH-003/005 |
| NOT-001 | *Given* the local stack, *then* Supabase Auth mail goes to Mailpit with ar/en branded templates; on hosted projects it goes through the provider SMTP | — | FR-AUTH-003 |
| SEC-006 | *Given* the repository, *then* `check-email-exists` is gone and no code calls it | AU-5 | Audit finding |
| SEC-007 | *Given* the table of 20 hostile redirect strings, *then* `sanitizeRedirect` returns `/` (or the locale home) for every one | AU-4 | NFR-SEC |
| TEST-001 | *Given* the local stack running, *when* `npm run e2e:auth` runs, *then* the four flows pass in ar and en | — | FR-AUTH-* |

## Definition of Ready (checked 2026-10-02)

- [x] Module spec, screens and error codes exist (links above).
- [x] Auth pages' exact look is covered by the Sprint 01 visual baselines.
- [x] Local stack runs with Mailpit (inbucket) for the e-mail flows.
- [ ] Q-010 / Q-017 (provider and sender domain) — **not blocking local work**; Mailpit locally, Supabase default SMTP on staging.

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-010 provider, Q-017 sender domain | Leadership | Pending |
| Visual check green for the auth pages | Sprint 01 | — |

## Acceptance Criteria

- [ ] Signing up with an existing e-mail shows the same success message (no oracle).
- [ ] `/login?redirect=https://evil.example` redirects to `/` only.
- [ ] Sessions survive refresh and are readable in Server Components.
- [ ] pgTAP: a user cannot read or update another profile.
- [ ] `npm run e2e:auth` passes in Arabic and English; the Sprint 01 visual suite is still green (auth pages unchanged).
- [ ] `grep -r check-email-exists app src supabase` returns nothing.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Sign up → Mailpit e-mail → confirm → land on the original page, in Arabic and in English.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Provider DNS (SPF/DKIM) not ready | Medium | Medium | Use Supabase default SMTP on staging; block production until verified |

## References & Specifications

- [Authentication](../../../06-security/authentication.md)
- [Authentication module](../../../11-modules/authentication/README.md)
- FR-AUTH-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| Database | `20261108000000_profiles.sql`: `profiles`, sign-up trigger (never fails a sign-up), e-mail sync, idempotent backfill, own-row RLS and column grants; pgTAP `02_profiles.sql` |
| Sessions | `@supabase/ssr` clients (`server.ts`, `browser.ts`, `proxy.ts`); root `proxy.ts` composes locale + session refresh and makes no network call without an auth cookie; `getUser()`/`requireUser()` on the server |
| Actions | `modules/auth`: Zod schemas (ar/en messages), `sanitizeRedirect`, Server Actions returning `Result<T>`; sign-up, reset and resend give identical answers whether or not an e-mail exists |
| Pages | The four auth pages keep their exact markup and CSS (Sprint 01 visual baselines unchanged); thin server wrappers redirect signed-in visitors; forms use `method="post"` so a failed hydration can never put credentials in a URL |
| Link handling | `/auth/confirm` token-hash route (works across browsers; redirects on the visitor's own host) |
| Account area | `/account`, `/account/profile`, `/account/security` with the new UI primitives |
| E-mail | Bilingual branded confirmation, recovery and e-mail-change templates; Mailpit locally |
| Security | `check-email-exists` deleted; open-redirect and enumeration covered by unit and E2E tests |
| Tests | 51 unit tests, 21 auth E2E tests against the real local Auth + Mailpit (production build, stable over repeated runs) |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Provider SMTP | Needs Q-010 / Q-017; staging uses the Supabase default sender until then |
| GoTrue still answers `user_already_exists` to direct API calls | Our pages hide it, but anyone calling the Auth endpoint with the public key can still probe e-mails. Mitigation: Auth rate limits + captcha before launch (Sprint 12 security review) |
| Account deletion (AUTH-009) | Moved to Sprint 04 (needs `audit_logs`) |
| `/account/registrations`, `/account/membership`, `/account/roles` | Land with their modules (Sprints 06, 07, 04) |
| Admin MFA | Proposed in the security design; scheduled with the admin screens (Sprint 11–12) |
| Client `AuthContext` | Still a read-only mirror of the cookie session; the root layout is not made dynamic on purpose (public pages stay static) |
