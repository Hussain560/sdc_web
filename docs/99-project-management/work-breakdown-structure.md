# Work Breakdown Structure

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Living — sizes are the original estimates; the actuals are in the last section |

## 1. Hierarchy

Adapted from Noviq: **Phase → Epic → Story → Task**. Stories are estimated in story points (Fibonacci 1, 2, 3, 5, 8, 13); stories above 8 points are split before entering a sprint.

| Points | Effort (volunteer-days, indicative) | Example |
| ------ | ----------------------------------- | ------- |
| 1 | < ½ day | Copy fix, config value |
| 2 | ½–1 day | Simple primitive component |
| 3 | 1–2 days | Table + RLS + pgTAP for a simple entity |
| 5 | 2–4 days | CRUD screen with server actions and tests |
| 8 | 4–6 days | Lifecycle transitions with function, UI and tests |
| 13 | > 1 week | Must be split |

## 2. Decomposition

```text
SDC Transformation
├── 0 Foundation (EP-FND, EP-SEC containment) ................................ ~15 SP
│   ├── Documentation review & approval
│   ├── Remote inspection, repository, access inventory
│   └── Containment (conditional)
├── 1 Baseline (EP-ENG, EP-DB, EP-UI) ........................................ ~55 SP
│   ├── Framework upgrade, TypeScript, lint/format, Node pin
│   ├── Test harnesses (Vitest, Playwright, pgTAP) + CI
│   ├── Environments (staging project, Vercel envs, env validation)
│   ├── Supabase config, migration baseline, seed
│   └── Tokens, Tailwind, locale routing, first primitives
├── 2 Identity & Access (EP-AUTH, EP-ACC, EP-CMT, NOT-001) ................... ~60 SP
│   ├── SSR auth flows + profiles
│   ├── RBAC schema, helpers, RLS, seeds, pgTAP matrix
│   ├── Admin role-assignment UI + dashboard shell
│   ├── Committees + leadership view
│   └── Auth email via provider
├── 3A Events & Registrations (EP-EVT, EP-REG, NOT-002) ...................... ~65 SP
├── 3B Membership & Members (EP-MBR, EP-MEM) .................................. ~60 SP
├── 3C Articles & Notifications (EP-ART, NOT-003) ............................. ~35 SP
├── 4 Management & Reports (EP-RPT, ACC-005/006, CMT-003, REG-006/007) ........ ~50 SP
├── 5 Hardening (EP-SEC) ....................................................... ~35 SP
├── 6 Launch (EP-LCH) .......................................................... ~20 SP
└── 7 Public redesign on Design System v2 (EP-RDS) ............................ ~82 SP
                                                                          Total ≈ 477 SP
```

At an assumed volunteer velocity of ~25–30 SP per 2-week sprint, the plan spanned roughly 17 sprints (8 months). That forecast turned out far too slow: see "Actuals" below.

## 3. Standard tasks per story (vertical slice)

1. Migration (table/columns, constraints, indexes, RLS, grants, comments)
2. pgTAP tests (policy matrix rows + constraints + transitions)
3. Generated types update
4. Zod schemas + module queries/actions
5. UI (primitives, both locales, both themes)
6. Unit/integration/E2E tests as applicable
7. Docs update (module doc, entity doc, rules if changed)
8. Release-note line (user-visible change)

## 4. Actuals (2026-10-17)

| Phase | Planned | Delivered | Notes |
| ----- | ------- | --------- | ----- |
| 0 Foundation | ~15 SP | 2026-10-02 → 10-04 | Repository and pipeline done; owner items (Q-025, P1 answers, access inventory) still open |
| 1 Baseline (Sprints 01–02) | ~55 SP | 2026-10-02 | CI on GitHub from 2026-10-04 |
| 2 Identity & Access (Sprints 03–04) | ~60 SP | 2026-10-02 | |
| 3A / 3B / 3C (Sprints 05–09) | ~160 SP | 2026-10-02 → 10-03 | Guest registration and accountless membership added (ADR-013) |
| 4 Management & reports (Sprints 10–11) | ~50 SP | 2026-10-03 | |
| 5 Hardening (Sprint 12) | ~35 SP | 2026-10-03 | Production verification pending |
| 6 Launch (Sprint 13) | ~20 SP | 2026-10-03 | Everything buildable is done; cutover belongs to the owners |
| 7 Public redesign (Sprints 14–16) | ~82 SP | 2026-10-10 → 10-11 | Merged in PRs #2, #3 and #4; follow-ups for registration form and About/Events second pass |

Lesson for re-forecasting: delivery with an AI agent is not limited by the volunteer-days in the table in section 1. The real limits are the owner's review time, account access (Supabase, Vercel, domain, e-mail) and approvals such as visual baselines and copy. Plan those, not the coding.
