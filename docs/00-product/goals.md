# Product Goals

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Goals describe outcomes, not features. Each goal has measurable signals so that the roadmap can be judged against them. Targets marked *(proposed)* need confirmation by leadership (**OPEN Q-016**).

## G1 — Leadership can run the community from the platform without a developer

Today every new event, article or leadership change requires editing source code and redeploying.

| Signal | Target *(proposed)* |
| ------ | ------------------- |
| Events created, published and closed by committee/leadership through the UI | 100% of new events after Phase 3 |
| Articles published through the UI | 100% of new articles after Phase 3 |
| Leadership/committee changes made through role assignments, not code | 100% after Phase 2 |
| Code deployments required to change content | 0 |

## G2 — Member and participant data is protected

| Signal | Target |
| ------ | ------ |
| Tables exposed to the public API without a reviewed RLS policy | 0 |
| Personal data (email, phone) readable by unauthorized users | 0 |
| Authorization decisions made only in the browser | 0 |

## G3 — Membership is managed through a fair, transparent intake process

| Signal | Target *(proposed)* |
| ------ | ------------------- |
| Applications received through the intake page during each open cycle | All of them (no side channels) |
| Applications with a recorded decision before the cycle's review deadline | 100% |
| Applicants notified of the outcome by email | 100% |

## G4 — Events are easy to discover, join and run

| Signal | Target *(proposed)* |
| ------ | ------------------- |
| Registration decision (accept/reject) recorded and emailed | 100% of registrations of approval-based events |
| Attendance recorded for completed events | ≥ 90% of completed events |
| Duplicate registrations per user per event | 0 (enforced by the database) |

## G5 — Leadership can see the community's health

| Signal | Target *(proposed)* |
| ------ | ------------------- |
| Community-wide dashboard (members, events, registrations, attendance, committee activity) available to founders/leadership | Phase 4 |
| Committee dashboard available to each committee head | Phase 4 |

## G6 — The platform is maintainable by rotating volunteers

| Signal | Target |
| ------ | ------ |
| Every change goes through a pull request with CI (lint, types, tests, build) | 100% after Phase 1 |
| Every database change is a versioned migration | 100% after Phase 1 |
| Every release is tagged and has release notes | 100% from `v0.1.0` |
| Onboarding a new developer to a running local environment | < 1 hour using [local development](../08-infrastructure/local-development.md) |

## G7 — Operates within free / low-cost infrastructure

| Signal | Target |
| ------ | ------ |
| Monthly infrastructure cost | Free tiers (Vercel Hobby/free, Supabase Free, free email tier) unless leadership approves spend (**OPEN Q-017**) |
| Free-tier limits monitored | See [operations](../08-infrastructure/operations.md) |
