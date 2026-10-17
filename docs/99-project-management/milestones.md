# Milestones

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Living document |

Each milestone is a gate: the release is tagged only when its criteria are met and signed off by the product owner and tech lead. The dates in the "Planned" column were the 2026-10-02 forecast; the work was delivered much earlier (see "Delivered").

| ID | Milestone | Version | Phase | Planned | Delivered | Acceptance criteria | Status |
| -- | --------- | ------- | ----- | ------- | --------- | ------------------- | ------ |
| M0 | Foundation approved | v0.1.0 | 0 | 2026-10-10 (S00) | repository and pipeline 2026-10-04 | Docs reviewed; P1 questions answered; repo + branch protection; remote state recorded; containment done if required | 🔄 Repository, branches and CI done. Open: P1 answers, Q-025 production inspection |
| M1 | Engineering baseline | v0.2.0 | 1 | 2026-11-07 (S02) | 2026-10-02 | CI required checks; migrations baseline; staging env; Next.js upgraded; tokens + locale routing skeleton; visual parity | ✅ Done. CI runs on GitHub; dev site and dev database deploy from `develop` |
| M2 | Access control live | v0.3.0 | 2 | 2026-12-05 (S04) | 2026-10-02 | SSR auth; RBAC tables + RLS + admin UI; no hardcoded authorization; leadership from DB; Auth emails via provider | ✅ Done in code. Open: provider SMTP for production (Q-010, Q-017), real first admins (Q-039) |
| M3 | Events from the database (KFUCS wizard) | v0.4.0 | 3A | 2027-01-02 (S06) | 2026-10-02 | Events lifecycle + public pages from DB; registrations with scoped review; email log; legacy data migrated; `/committee` and email Edge Functions retired | ✅ Done. Registration is now open to guests without an account |
| M4 | Membership intake ready | v0.5.0 | 3B | 2027-01-30 (S08) | 2026-10-03 | `/join` with cycles; applications reviewed; members linked to accounts; directory from view; legacy claim | ✅ Done. Applying needs no account; acceptance creates the account (ADR-013) |
| M5 | Content from the database | v0.6.0 | 3C | 2027-02-13 (S09) | 2026-10-03 | Articles lifecycle; legacy articles migrated; full notification catalogue | ✅ Done. Only acceptance e-mails are sent by owner decision |
| M6 | Management & reports | v0.7.0 | 4 | 2027-03-13 (S11) | 2026-10-03 | Dashboards, attendance sessions (QR/online/manual) + finalization, exports, audit UI, settings | ✅ Done. Certificates exist behind a setting (Q-020) |
| M7 | Hardened | v0.8.0 | 5 | 2027-03-27 (S12) | 2026-10-03 | WCAG AA verified; CSP enforced; CWV targets; privacy flows; restore drill | ✅ Done in code. Production verification pending |
| M8 | 🚀 Launch | v1.0.0 | 6 | 2027-04-10 (S13) | — | All Must requirements; production cutover; runbooks; two admins | 🔄 Rehearsed on a restored copy; candidate tags `v1.0.0-rc.1` and `-rc.2` exist on both repositories. Cutover and the tag are owner actions |
| M9 | Public redesign on Design System v2 | v1.1.0 | 7 | 2027-05-22 (S16) | 2026-10-10 → 10-11 | Tokens and components; header and footer on every public route; Home, event page, registration dialog, members (privacy first) and every remaining public page on v2; legacy public CSS deleted; owner-approved baselines | 🔄 Built and merged (PRs #2–#4). Open: baselines for `/about` and `/events`, owner copy review, release number (see [action board](./action-board.md)) |

Status legend: ✅ Complete · 🔄 In progress · 🔜 Next · ⬜ Planned · ⛔ Blocked.
