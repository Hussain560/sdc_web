# Sprints

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Conventions

Adapted from Noviq's sprint documentation (plan + notes + audit reports), sized for SDC.

| Item | Convention |
| ---- | ---------- |
| Length | 2 weeks (Proposed) |
| Folder | `sprints/sprint-NN-<slug>/` (two-digit number, kebab slug, e.g., `sprint-01-engineering-baseline`) |
| Files per sprint | `plan.md` (from `_template/plan.md`), `notes.md` (living backlog/progress during the sprint), `report.md` (review + retrospective at the end) |
| Audit reports | `sprints/reports/<sprint>-<topic>-audit.md` when a sprint reveals a significant gap; may lead to an inserted sprint (documented in §3 below, as Noviq does) |
| Story ids | Backlog ids (`EVT-003`); sprint-local task ids `S{NN}-T{nn}` |
| Status emojis | ✅ Done · 🔄 In progress · ⬜ Not started · ⛔ Blocked · ↪ Carried over |

## 2. Sprint roadmap

Dates are indicative (2-week sprints starting Sundays, Saudi work week) and will be re-forecast after Sprint 02 using measured velocity. Ramadan (≈ 2027-02-08 → 2027-03-09) and Eid reduce capacity in Sprints 09–11. **Swap rule:** if the next membership intake (Q-011) opens before January 2027, Sprints 07–08 move before 05–06.

| Sprint | Name | Dates | Phase | Milestone / version | Planned SP | Status |
| ------ | ---- | ----- | ----- | ------------------- | ---------- | ------ |
| [Sprint 00](./sprint-00-foundation-close/plan.md) | Foundation close (repo, Q-025, P1 answers, review) | 2026-10-04 → 10-10 | 0 | M0 · `v0.1.0` | 15 | 🔄 In progress ([notes](./sprint-00-foundation-close/notes.md)) |
| [Sprint 01](./sprint-01-engineering-baseline-1/plan.md) | Engineering baseline I — tooling, tests, CI, visual regression | 2026-10-11 → 10-24 | 1 | M1 | 25 | ✅ Local scope complete |
| [Sprint 02](./sprint-02-engineering-baseline-2/plan.md) | Engineering baseline II — environments, migrations, tokens, locale routing | 2026-10-25 → 11-07 | 1 | M1 · `v0.2.0` | 29 | ✅ Local scope complete |
| [Sprint 03](./sprint-03-auth-and-profiles/plan.md) | Authentication & profiles | 2026-11-08 → 11-21 | 2 | M2 | 23 | ✅ Local scope complete |
| [Sprint 04](./sprint-04-rbac-committees-shell/plan.md) | RBAC, committees, admin, dashboard shell | 2026-11-22 → 12-05 | 2 | M2 · `v0.3.0` | 28 | ✅ Local scope complete |
| [Sprint 05](./sprint-05-events-wizard-and-lifecycle/plan.md) | Events I — KFUCS wizard, data model, lifecycle | 2026-12-06 → 12-19 | 3A | M3 | 29 | ✅ Local scope complete |
| [Sprint 06](./sprint-06-events-public-and-registrations/plan.md) | Events II — public pages from DB, registrations, notifications | 2026-12-20 → 2027-01-02 | 3A | M3 · `v0.4.0` | 30 | ✅ Local scope complete |
| [Sprint 07](./sprint-07-membership-intake/plan.md) | Membership I — reference data, cycles, `/join` | 2027-01-03 → 01-16 | 3B | M4 | 24 | ✅ Local scope complete |
| [Sprint 08](./sprint-08-members-and-directory/plan.md) | Membership II — review, members, directory, claim | 2027-01-17 → 01-30 | 3B | M4 · `v0.5.0` | 26 | ✅ Local scope complete |
| [Sprint 09](./sprint-09-articles-and-notifications/plan.md) | Articles & notifications completion | 2027-01-31 → 02-13 | 3C | M5 · `v0.6.0` | 20 | ✅ Local scope complete |
| [Sprint 10](./sprint-10-attendance-and-committees/plan.md) | Attendance sessions (KFUCS), certificates model, committees | 2027-02-14 → 02-27 | 4 | M6 | 21 | ✅ Local scope complete |
| [Sprint 11](./sprint-11-reports-audit-settings/plan.md) | Reports, audit log, exports, settings | 2027-02-28 → 03-13 | 4 | M6 · `v0.7.0` | 20 | ✅ Local scope complete |
| [Sprint 12](./sprint-12-hardening/plan.md) | Quality & security hardening | 2027-03-14 → 03-27 | 5 | M7 · `v0.8.0` | 24 | ✅ Done locally (visual baseline approval pending) |
| [Sprint 13](./sprint-13-launch/plan.md) | Production readiness & launch | 2027-03-28 → 04-10 | 6 | M8 · `v1.0.0` 🚀 | 16 | 🔄 Local work done; production actions with owners |

Each sprint folder gets `notes.md` when it starts and `report.md` when it ends (from [`_template/`](./_template/plan.md)).

## 3. Inserted sprints log

| Date | Inserted sprint | Reason | Shifted |
| ---- | --------------- | ------ | ------- |
| — | — | — | — |

## 4. Template

[`_template/`](./_template/plan.md): `plan.md`, `notes.md`, `report.md`.
