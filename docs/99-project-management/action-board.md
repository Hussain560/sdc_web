# Action Board — What To Do Now

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Living document — update it at every sprint planning and review |
| **Current sprint** | [Sprint 00 — Foundation close](./sprints/sprint-00-foundation-close/plan.md) (2026-10-04 → 10-10) |

One page that answers *"what do we do next, and who does it?"*. Details live in the linked sprint plans.

## 1. Now (this week)

| # | Action | Owner | Blocks | Done when |
| - | ------ | ----- | ------ | --------- |
| 1 | **On hold (owner instruction 2026-10-02: do not push).** The 4 local commits on `chore/platform-foundation` stay local; the push URL is disabled. The owner decides when (and whether) to push and open a PR | Project owner | CI on GitHub (Sprint 01) | Owner gives an explicit go |
| 2 | Log in to Supabase with the account that owns `sdc-members` and run the read-only dump (commands in [Sprint 00 task 3](./sprints/sprint-00-foundation-close/plan.md#technical-tasks)) | Supabase owner | Containment decision, migration baseline | Q-025 answered |
| 3 | If production is exposed: apply the containment migration (`v0.1.1`) | Tech lead | Security | Anon can no longer write `members` or read registrations |
| 4 | Leadership session to answer the P1 questions (Q-003, Q-004, Q-005, Q-010, Q-011, Q-017, Q-039, Q-040) | Project owner + leadership | Sprints 03–05 | Answers recorded in [open questions](../90-decisions/open-questions.md) |
| 5 | Review the docs — start with [ADR-012](../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md), the [public](../10-design-system/PUBLIC-SCREENS/README.md) and [internal](../10-design-system/INTERNAL-SCREENS/README.md) screens | Project owner + tech lead | M0 | PR comments resolved |
| 6 | Access inventory (GitHub, Vercel, Supabase, Gmail, domain) and a shared password manager | Project owner | Staging, deployments | [Risk R-013](../01-project/risk-register.md) closed |

## 2. Next (Sprints 01–02, Phase 1)

- CI with required checks, plus a **visual-regression check of every public page**, so the frozen look cannot drift.
- Prettier/Husky/commitlint.
- Vitest, Playwright and pgTAP.
- Migrations baseline and staging.
- Tokens holding the current palette.
- `/ar` and `/en` routing.

## 3. Later (Sprints 03–13)

| Sprints | Outcome |
| ------- | ------- |
| 03–04 | Server-side auth; roles and permissions from the database; dashboard shell; no hardcoded e-mail lists |
| 05–06 | Events with the **KFUCS 4-step wizard**; public event pages from the database (same look); registrations reviewed in the dashboard |
| 07–08 | Annual membership intake on `/join`; members linked to accounts; privacy-safe directory |
| 09 | Threads (articles) from the database |
| 10–11 | Attendance sessions with QR (KFUCS); reports; audit log; settings |
| 12–13 | Accessibility, security, performance; launch `v1.0.0` (≈ April 2027) |

## 4. Decisions waiting on people

| Question | Needed by | Recommended default if unanswered |
| -------- | --------- | --------------------------------- |
| Q-025 production state | Sprint 00 | Treat as exposed → containment |
| Q-011 next intake date | Sprint 04 planning | Events first (3A), then membership (3B) |
| Q-003 / Q-039 roles and first admins | Sprint 04 | Recommended role set; two Tech & Development admins |
| Q-005 event approver | Sprint 05 | Community leader |
| Q-020 certificates and threshold | Sprint 10 | Built behind a setting, off; KFUCS threshold 70 % |

## 5. How we work

- **Every change:** branch from `develop` → Conventional Commits → PR with screenshots (ar/en, dark/light) → CI green → review → merge ([git workflow](../07-engineering/git-workflow.md)).
- **Story readiness:** a story enters a sprint only when it meets the [Definition of Ready](./definition-of-ready.md). It is done only when it meets the [Definition of Done](./definition-of-done.md).
- **Design:** public pages never change visually without an explicit approval (D-009). The internal dashboard follows the [INTERNAL-SCREENS](../10-design-system/INTERNAL-SCREENS/README.md) blueprints.
- **Agents and skills:** see [AI agent skills](../07-engineering/ai-agent-skills.md). Design skills must respect the frozen identity.
