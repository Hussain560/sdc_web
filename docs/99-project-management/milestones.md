# Milestones

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Each milestone is a gate: the release is tagged only when its criteria are met and signed off by the product owner and tech lead.

| ID | Milestone | Version | Phase | Target date | Acceptance criteria | Status |
| -- | --------- | ------- | ----- | ----------- | ------------------- | ------ |
| M0 | Foundation approved | v0.1.0 | 0 | 2026-10-10 (S00) | Docs reviewed; P1 questions answered; repo + branch protection; remote state recorded; containment done if required | 🔄 In progress |
| M1 | Engineering baseline | v0.2.0 | 1 | 2026-11-07 (S02) | CI required checks; migrations baseline; staging env; Next.js upgraded; tokens + locale routing skeleton; visual parity | 🔄 Started early (Next 16 + TS + ESLint done 2026-10-02) |
| M2 | Access control live | v0.3.0 | 2 | 2026-12-05 (S04) | SSR auth; RBAC tables + RLS + admin UI; no hardcoded authorization; leadership from DB; Auth emails via provider | ⬜ Planned |
| M3 | Events from the database (KFUCS wizard) | v0.4.0 | 3A | 2027-01-02 (S06) | Events lifecycle + public pages from DB; registrations with scoped review; email log; legacy data migrated; `/committee` and email Edge Functions retired | ⬜ Planned |
| M4 | Membership intake ready | v0.5.0 | 3B | 2027-01-30 (S08) | `/join` with cycles; applications reviewed; members linked to accounts; directory from view; legacy claim | ⬜ Planned |
| M5 | Content from the database | v0.6.0 | 3C | 2027-02-13 (S09) | Articles lifecycle; legacy articles migrated; full notification catalogue | ⬜ Planned |
| M6 | Management & reports | v0.7.0 | 4 | 2027-03-13 (S11) | Dashboards, attendance sessions (QR/online/manual) + finalization, exports, audit UI, settings | ⬜ Planned |
| M7 | Hardened | v0.8.0 | 5 | 2027-03-27 (S12) | WCAG AA verified; CSP enforced; CWV targets; privacy flows; restore drill | ✅ Done locally (production verification pending) |
| M8 | 🚀 Launch | v1.0.0 | 6 | 2027-04-10 (S13) | All Must requirements; production cutover; runbooks; two admins | 🔄 Rehearsed locally; cutover is an owner action |

Status legend: ✅ Complete · 🔄 In progress · 🔜 Next · ⬜ Planned · ⛔ Blocked.
