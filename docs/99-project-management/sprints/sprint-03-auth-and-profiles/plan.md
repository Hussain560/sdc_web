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
| **Capacity**        | ~25 SP — planned 23 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Sign-up, sign-in, sign-out and password reset run on the server with cookie sessions; every account has a `profiles` row; the e-mail-existence oracle is gone; auth e-mails come from the community provider with bilingual templates. The auth pages keep their exact look.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| AUTH-005 | `profiles` table + sign-up trigger + backfill for existing users | P0 | 3 | — | ⬜ |
| AUTH-001 | Sign-up with server-validated name/password and a branded confirmation e-mail | P0 | 5 | — | ⬜ |
| AUTH-002 | Sign in and return to the page I came from (`?redirect=` same-site only) | P0 | 3 | — | ⬜ |
| AUTH-003 | Reset password without revealing whether an e-mail exists | P0 | 3 | — | ⬜ |
| AUTH-004 | Edit my name and language preference (`/account/profile`) | P1 | 3 | — | ⬜ |
| NOT-001 | Auth e-mails through the provider custom SMTP; bilingual templates ⛔ Q-010, Q-017 | P0 | 5 | — | ⬜ |
| SEC-006 | Delete the `check-email-exists` Edge Function | P0 | 1 | — | ⬜ |

## Technical Tasks

1. **SSR clients** — `src/lib/supabase/{server,browser,proxy}.ts` with `@supabase/ssr`; `proxy.ts` refreshes sessions.
2. **Server actions** — `modules/auth/actions.ts` with Zod schemas shared with the forms; localized error mapping.
3. **Callback** — `/auth/confirm` route (token-hash flow).
4. **Profiles** — migration + RLS (owner reads/updates limited columns) + pgTAP.
5. **UI** — same markup and CSS as today ([09-auth-pages](../../../10-design-system/PUBLIC-SCREENS/09-auth-pages.md)); the register copy states that an account is not membership (D-001).
6. **E-mail** — provider SMTP in `config.toml` (Mailpit locally) and in the hosted projects; templates in `supabase/templates/`.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

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

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
