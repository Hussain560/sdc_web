# Sprints

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Living — statuses and delivery dates are kept in sync with `develop` |

## 1. Conventions

Adapted from Noviq's sprint documentation (plan + notes + audit reports), sized for SDC.

| Item | Convention |
| ---- | ---------- |
| Length | 2 weeks planned. Actual delivery was much faster (see the Delivered column), so the planned dates are a forecast |
| Folder | `sprints/sprint-NN-<slug>/` (two-digit number, kebab slug, e.g., `sprint-01-engineering-baseline`) |
| Files per sprint | `plan.md` (from `_template/plan.md`), `notes.md` (living backlog/progress during the sprint), `report.md` (review + retrospective at the end) |
| Audit reports | `sprints/reports/<sprint>-<topic>-audit.md` when a sprint reveals a significant gap; may lead to an inserted sprint (documented in §3 below, as Noviq does) |
| Story ids | Backlog ids (`EVT-003`); sprint-local task ids `S{NN}-T{nn}` |
| Status emojis | ✅ Done · 🔄 In progress · ⬜ Not started · ⛔ Blocked · ↪ Carried over |

## 2. Sprint roadmap

Planned dates are the original forecast (2-week sprints starting Sundays, Saudi work week). The Delivered column is what happened. Ramadan (≈ 2027-02-08 → 2027-03-09) and Eid reduce capacity in Sprints 09–11. **Swap rule:** if the next membership intake (Q-011) opens before January 2027, Sprints 07–08 move before 05–06.

| Sprint | Name | Planned dates | Phase | Milestone / version | Planned SP | Delivered | Status |
| ------ | ---- | ------------- | ----- | ------------------- | ---------- | --------- | ------ |
| [Sprint 00](./sprint-00-foundation-close/plan.md) | Foundation close (repo, Q-025, P1 answers, review) | 2026-10-04 → 10-10 | 0 | M0 · `v0.1.0` | 15 | 2026-10-02 → 10-04 | 🔄 Repository and pipeline done; owner items open ([notes](./sprint-00-foundation-close/notes.md)) |
| [Sprint 01](./sprint-01-engineering-baseline-1/plan.md) | Engineering baseline I — tooling, tests, CI, visual regression | 2026-10-11 → 10-24 | 1 | M1 | 25 | 2026-10-02 | ✅ Complete |
| [Sprint 02](./sprint-02-engineering-baseline-2/plan.md) | Engineering baseline II — environments, migrations, tokens, locale routing | 2026-10-25 → 11-07 | 1 | M1 · `v0.2.0` | 29 | 2026-10-02 | ✅ Complete |
| [Sprint 03](./sprint-03-auth-and-profiles/plan.md) | Authentication & profiles | 2026-11-08 → 11-21 | 2 | M2 | 23 | 2026-10-02 | ✅ Complete in code (provider SMTP waits on Q-010/Q-017) |
| [Sprint 04](./sprint-04-rbac-committees-shell/plan.md) | RBAC, committees, admin, dashboard shell | 2026-11-22 → 12-05 | 2 | M2 · `v0.3.0` | 28 | 2026-10-02 | ✅ Complete in code |
| [Sprint 05](./sprint-05-events-wizard-and-lifecycle/plan.md) | Events I — KFUCS wizard, data model, lifecycle | 2026-12-06 → 12-19 | 3A | M3 | 29 | 2026-10-02 | ✅ Complete |
| [Sprint 06](./sprint-06-events-public-and-registrations/plan.md) | Events II — public pages from DB, registrations, notifications | 2026-12-20 → 2027-01-02 | 3A | M3 · `v0.4.0` | 30 | 2026-10-02 | ✅ Complete (guest registration added 2026-10-03) |
| [Sprint 07](./sprint-07-membership-intake/plan.md) | Membership I — reference data, cycles, `/join` | 2027-01-03 → 01-16 | 3B | M4 | 24 | 2026-10-02 | ✅ Complete (accountless applications, ADR-013) |
| [Sprint 08](./sprint-08-members-and-directory/plan.md) | Membership II — review, members, directory, claim | 2027-01-17 → 01-30 | 3B | M4 · `v0.5.0` | 26 | 2026-10-03 | ✅ Complete |
| [Sprint 09](./sprint-09-articles-and-notifications/plan.md) | Articles & notifications completion | 2027-01-31 → 02-13 | 3C | M5 · `v0.6.0` | 20 | 2026-10-03 | ✅ Complete |
| [Sprint 10](./sprint-10-attendance-and-committees/plan.md) | Attendance sessions (KFUCS), certificates model, committees | 2027-02-14 → 02-27 | 4 | M6 | 21 | 2026-10-03 | ✅ Complete (certificates off until Q-020) |
| [Sprint 11](./sprint-11-reports-audit-settings/plan.md) | Reports, audit log, exports, settings | 2027-02-28 → 03-13 | 4 | M6 · `v0.7.0` | 20 | 2026-10-03 | ✅ Complete |
| [Sprint 12](./sprint-12-hardening/plan.md) | Quality & security hardening | 2027-03-14 → 03-27 | 5 | M7 · `v0.8.0` | 24 | 2026-10-03 | ✅ Complete; production verification pending |
| [Sprint 13](./sprint-13-launch/plan.md) | Production readiness & launch | 2027-03-28 → 04-10 | 6 | M8 · `v1.0.0` 🚀 | 16 | 2026-10-03 (local) | 🔄 Buildable work done; cutover and tag are owner actions |
| [Sprint 14](./sprint-14-design-system-v2-foundation/plan.md) | Public redesign I — Design System v2 tokens, components, chrome, auth layout | 2027-04-11 → 04-24 | 7 | M9 | 27 | 2026-10-10 (PR #2) | ✅ Complete |
| [Sprint 15](./sprint-15-home-and-event-page/plan.md) | Public redesign II — chrome roll-out, home, event page, registration dialog | 2027-04-25 → 05-08 | 7 | M9 | 28 | 2026-10-10 (PR #3) | ✅ Complete |
| [Sprint 16](./sprint-16-members-and-remaining-pages/plan.md) | Public redesign III — members (privacy first) and the remaining pages | 2027-05-09 → 05-22 | 7 | M9 · `v1.1.0` | 27 | 2026-10-10 → 10-11 (PRs #3, #4) | ✅ Complete; baselines, copy review and the tag are open |
| [Sprint 17](./sprint-17-members-profiles-and-motion/plan.md) | Members: rich profiles, photo upload, add-member wizard, assign-position fixes, members redesign, motion | 2026-10-18 → 10-31 | 7 | M10 | 36 | — | 🔄 Merged into `develop` (Sprint 17 PR); see its plan for what is open |
| [Sprint 18](./sprint-18-membership-lifecycle/plan.md) | Membership lifecycle: join, review, activate, renew, end, card | 2026-11-01 → 11-14 | 7 | M11 | 47 | 2026-10-21 → 10-24 | ✅ Merged into `develop`; pixel review and old specs open ([next steps](./sprint-18-membership-lifecycle/NEXT-STEPS.md)) |
| [Sprint 19](./sprint-19-management-and-events/plan.md) | Management and events: dashboard per role, event lifecycle and detail, presenters, PNG certificates, committees, articles, reports | 2026-10-25 → 11-21 | 7 | M12 | 61 | — | 🔜 Planned (step 0: designs) |

Each sprint folder gets `notes.md` when it starts and `report.md` when it ends (from [`_template/`](./_template/plan.md)).

## 3. Inserted sprints log

| Date | Inserted sprint | Reason | Shifted |
| ---- | --------------- | ------ | ------- |
| 2026-10-04 | — | Sprints 14–16 were not inserted by an audit; they were planned on 2026-10-10 after the owner approved Design System v2 (ADR-014) and delivered at once | None |

## 4. Template

[`_template/`](./_template/plan.md): `plan.md`, `notes.md`, `report.md`.
