# Sprint 12 — Quality & Security Hardening

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 12 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2027-03-14 |
| **End Date**          | 2027-03-27 |
| **Phase / Milestone** | Phase 5 — Quality & Security Hardening / M7 |
| **Target version**    | `v0.8.0` (M7 exit) |
| **Capacity**          | ~28 SP — planned 24 SP |
| **Team**              | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**            | 🔄 Local implementation in progress (2026-10-03) — see *Implementation Status* |

## Sprint Objective

The platform meets WCAG 2.1 AA (the project target, NFR-A11Y-001) with axe blocking in CI, runs an **enforced** Content-Security-Policy and the full set of security headers, meets the Core Web Vitals budget, honours the privacy obligations (notice, consent, data-subject access and deletion, retention), and has backups that were **actually restored** in a drill. The remaining legacy CSS of the public pages stays mapped to tokens **with no visual change** (D-009).

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| SEC-004 | Accessibility audit and fixes; axe blocking in CI | P0 | 8 | — | ⬜ |
| SEC-002 | CSP enforced, security headers (HSTS, nosniff, referrer, permissions, frame-ancestors) | P0 | 3 | — | ⬜ |
| SEC-003 | Privacy notice, consent capture, data-subject flows (access, deletion), retention job ⛔ Q-031 wording | P0 | 5 | — | ⬜ |
| SEC-005 | Backup workflow, health endpoint, keep-alive, restore drill | P0 | 3 | — | ⬜ |
| ENG-010 | Performance pass: image sizing and loading, CWV budget check | P1 | 5 | — | ⬜ |

### Acceptance criteria per story

**SEC-004 — Accessibility**
- Playwright + `@axe-core/playwright` runs on the public pages and the dashboard shell × `ar`/`en` × dark/light; **zero serious or critical** violations; the test fails the build.
- Icon-only controls have accessible names in the active language (A-3); dialogs are native `<dialog>` (focus trap, Escape, restore) (A-4); focus ring is visible on every focusable element (A-2); status is text plus colour (A-6); `prefers-reduced-motion` respected (A-10).
- Contrast fixes use **existing tokens only**; if a pair cannot pass without a new colour it is reported, not changed (D-009).

**SEC-002 — Headers and CSP**
- Every response carries `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation off), `X-Frame-Options`/`frame-ancestors 'none'`; HSTS in production only.
- CSP **enforced** with `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, Supabase host in `connect-src`/`img-src`, Google Fonts only where still used; violations posted to `/api/csp-report` and logged without personal data.
- The whole e2e suite (public, auth, certificates PDF) passes under the policy.

**SEC-003 — Privacy**
- `/privacy` (ar/en) renders the notice from a Markdown source; content is marked *pending legal review* until Q-031 is answered. Linked from the footer, `/join`, the guest registration modal and the sign-in page.
- Consent is recorded with timestamp and notice version wherever personal data is collected (applications already do; **guest registrations now do**).
- A signed-in member can **download their data** (profile, member record, applications, registrations, certificates) as JSON and **request deletion** (a `data_requests` row, audited, e-mail to leadership); system administrators see and close requests.
- A retention function anonymizes data past the proposed retention periods ([data protection §5](../../../06-security/data-protection-and-privacy.md)) and runs from a protected cron route; it is covered by pgTAP.

**SEC-005 — Backups and health**
- `GET /api/health` returns 200 only when the database answers (no secrets, no personal data); the keep-alive workflow calls it daily.
- `backup.yml` writes an encrypted logical dump nightly (30-day retention); `scripts/restore-drill.mjs` restores a dump into a scratch database and runs the smoke queries; the **measured time** is recorded in [operations](../../../08-infrastructure/operations.md).

**ENG-010 — Performance**
- Images in public views have explicit dimensions or aspect-ratio boxes, `loading="lazy"` below the fold and `fetchpriority="high"` for the LCP image (no visual change).
- A Playwright perf test on a production build asserts CLS < 0.1 and LCP < 2.5 s for home and event pages; a script compares first-load JS with the recorded baseline.

## Technical Tasks

| Id | Task | Story |
| -- | ---- | ----- |
| S12-T01 | Install `@axe-core/playwright`; `tests/e2e/a11y.spec.ts` over routes × locale × theme; triage and fix findings | SEC-004 |
| S12-T02 | Run the `accessibility` and `web-design-guidelines` skills on the dashboard shell and public forms ([AI agent skills](../../../07-engineering/ai-agent-skills.md)); fix names, focus, contrast within the frozen palette | SEC-004 |
| S12-T03 | `next.config.ts` headers (CSP, HSTS, nosniff, referrer, permissions); `/api/csp-report` | SEC-002 |
| S12-T04 | CSP verification test (headers present on public, auth and internal routes) and full e2e under the policy | SEC-002 |
| S12-T05 | `/privacy` page + Markdown source; footer / join / registration / login links | SEC-003 |
| S12-T06 | Consent on guest registration (`consent_at`, `consent_version`) end to end | SEC-003 |
| S12-T07 | `data_requests` table, `export_my_data()`, `request_account_deletion()`, account page *My data*, admin handling | SEC-003 |
| S12-T08 | `private.apply_retention()` + `/api/cron/retention` + pgTAP | SEC-003 |
| S12-T09 | `/api/health`, `.github/workflows/backup.yml`, `keepalive.yml` | SEC-005 |
| S12-T10 | `scripts/restore-drill.mjs`; run the drill locally; record timings in operations | SEC-005 |
| S12-T11 | Image attributes pass on public views; perf spec (CLS/LCP); bundle-size check script | ENG-010 |
| S12-T12 | Docs: security model §10 updated to the enforced policy, operations, testing strategy, NFR status | all |

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-031 privacy content, retention periods and contact | Leadership | Pending — built with the proposed defaults and marked *pending review* |
| Q-025 / Q-027 production and hosting owners (for the real backup secrets) | Leadership | Pending — workflows written, secrets not set |
| Sprints 01–11 | Team | ✅ done locally |

## Acceptance Criteria

- [ ] axe: zero serious/critical issues on all audited routes (blocking test).
- [ ] CSP enforced; headers present on every route class; e2e green under the policy.
- [ ] `/privacy` live in both languages; consent recorded for every personal-data form; export and deletion request work; retention covered by pgTAP.
- [ ] LCP < 2.5 s and CLS < 0.1 for the home and event pages (production build); first-load JS within baseline.
- [ ] Restore drill documented in [operations](../../../08-infrastructure/operations.md) with the measured time.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md).
- [ ] Deployed to staging; demo script executed (**owner action**, see Known Gaps).

## Sprint Review Checklist (demo script)

- [ ] Keyboard-only walkthrough: join form → guest event registration → check-in page → dashboard review.
- [ ] Arabic RTL and English LTR, dark and light.
- [ ] At least one permission-denied case shown.
- [ ] Open DevTools: show the enforced CSP header and a blocked inline-injection attempt.
- [ ] Show *My data* export and a deletion request handled by an administrator.
- [ ] Release-notes lines collected.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Accessibility fixes touch public visuals | Medium | Medium | Only focus rings, labels and contrast inside the palette; every visual diff explicitly approved; the visual suite stays green |
| CSP breaks Next.js inline scripts or Supabase calls | Medium | High | Start from the documented policy, verify with the whole e2e suite; nonce-based `script-src` is a recorded follow-up if inline scripts can be removed |
| Retention function deletes too much | Low | High | Anonymize (never hard-delete rows referenced by reports); pgTAP fixtures with known ages; dry-run mode returns counts |
| Privacy text invented without legal review | Medium | Medium | Clearly marked *pending legal review*; Q-031 stays open on the action board |

## References & Specifications

Read for this sprint (paths relative to `docs/`):

| Area | Documents |
| ---- | --------- |
| Requirements | [non-functional-requirements](../../../02-requirements/non-functional-requirements.md) (NFR-SEC-001…011, NFR-PRIV-001…006, NFR-PERF-001…005, NFR-A11Y-001…005, NFR-REL-003, NFR-OPS-001…005) · [functional-requirements](../../../02-requirements/functional-requirements.md) |
| Security | [security-model](../../../06-security/security-model.md) (§3 threats, §6 validation, §10 headers, §11 rate limiting, §13 supply chain, §15 incident response) · [data-protection-and-privacy](../../../06-security/data-protection-and-privacy.md) (inventory, principles, data-subject requests, retention, breach) · [authentication](../../../06-security/authentication.md) · [authorization-model](../../../06-security/authorization-model.md) · [permission-catalog](../../../06-security/permission-catalog.md) |
| Design | [accessibility](../../../10-design-system/accessibility.md) (A-1…A-12) · [PUBLIC 12-new-public-pages §4 privacy notice](../../../10-design-system/PUBLIC-SCREENS/12-new-public-pages.md#4-privacy-notice-privacy--open-q-031) · [AI agent skills and the frozen identity](../../../07-engineering/ai-agent-skills.md) |
| Infrastructure | [operations](../../../08-infrastructure/operations.md) (backups, runbook, monitoring, scheduled jobs, free-tier limits) · [ci-cd](../../../08-infrastructure/ci-cd.md) · [environments](../../../08-infrastructure/environments.md) · [environment-variables](../../../08-infrastructure/environment-variables.md) · [deployment](../../../08-infrastructure/deployment.md) |
| Quality | [testing-strategy](../../../09-quality/testing-strategy.md) · [manual-qa-checklist](../../../09-quality/manual-qa-checklist.md) · [definition-of-done](../../definition-of-done.md) |
| Decisions | [ADR-013 accounts for members only](../../../90-decisions/ADR-013-accounts-for-members-only.md) (guest forms need anti-spam and consent) · [ADR-007 CI/CD](../../../90-decisions/ADR-007-ci-cd-strategy.md) · [open questions](../../../90-decisions/open-questions.md) Q-017, Q-024, Q-025, Q-027, Q-031 |

Requirements: NFR-SEC-005/007/009/010, NFR-PRIV-001…006, NFR-PERF-001/003/005, NFR-A11Y-001…005, NFR-REL-003, NFR-OPS-003/004.

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| SEC-004 accessibility | axe specs for public routes and 18 dashboard routes (ar/en, both themes); zero serious/critical findings. Light-theme contrast fixed with existing palette primitives (`src/styles/a11y.css`, light `--accent`). |
| SEC-002 headers and CSP | `src/lib/security-headers.ts`, enforced CSP, report endpoint `/api/csp-report`, `/api/health`; `tests/e2e/security-headers.spec.ts`. |
| SEC-003 privacy | Notice at `/privacy` (version `2027-03-draft`), consent recorded for guests and applicants, member data export, deletion requests handled by an administrator, `run_retention` cron (weekly); pgTAP `15_privacy.sql` and `privacy.spec.ts`. |
| SEC-005 backups | `scripts/restore-drill.mjs` passed (counts, 50 policies, RLS flags); `backup.yml` and `keepalive.yml` workflows; operations.md updated. |
| ENG-010 performance | `next/image` for logos, lazy cover images, `perf.spec.ts` (LCP, CLS) and `scripts/check-bundle.mjs` budget (581 kB of 640 kB gzip). |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Visual baselines pending approval | The footer now links to the privacy notice and the logos use `next/image`, so every public baseline differs by about 3,400 px in the footer only. `e2e:update` needs the owner's approval (D-009 gate). |
| CSP is not nonce based | `script-src` keeps `'unsafe-inline'` and `img-src` allows any https; tighten after launch. |
| Q-031 | Privacy wording and retention periods are a draft awaiting legal review. |
| Owner actions | Backup secrets (`SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY`), `HEALTH_URLS`, staging project. |
| Covers not optimized | Event and article covers are lazy but not `next/image` (remote hosts vary). |
| Bundle budget | Whole-app proxy, not per-route. |
| Audit log retention | Not purged by `run_retention`. |
