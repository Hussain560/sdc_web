# Access Inventory (FND-005)

| Field            | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Last Updated** | 2026-10-02                                                                |
| **Status**       | Template — the project owner fills it in                                  |
| **Rule**         | Names and roles only. **Never write passwords, keys or tokens in this file.** They live in the shared password manager. |

Why: SDC is run by volunteers who change every year. If one person owns an account alone, the project is blocked when they leave ([risk R-013](../../../01-project/risk-register.md)).

## 1. Accounts and owners

| Service | Used for | Owner today | Second owner | Recovery e-mail / phone owner | Where credentials live |
| ------- | -------- | ----------- | ------------ | ----------------------------- | ---------------------- |
| GitHub org `sdc-saudi` | Source, CI, releases | ⬜ | ⬜ | ⬜ | Password manager |
| Vercel team | Hosting, previews, cron | ⬜ | ⬜ | ⬜ | Password manager |
| Supabase org (project `sdc-members`) | Database, Auth, Storage | ⬜ | ⬜ | ⬜ | Password manager |
| Supabase `sdc-staging` (to create, Sprint 02) | Staging | — | — | — | Password manager |
| E-mail provider (Q-010; Brevo recommended) | Transactional e-mail | ⬜ | ⬜ | ⬜ | Password manager |
| Sender domain registrar and DNS (Q-017) | SPF / DKIM / DMARC | ⬜ | ⬜ | ⬜ | Password manager |
| Gmail account used by the legacy Edge Functions | To be retired in Sprint 06 | ⬜ | ⬜ | ⬜ | Password manager |
| Social accounts (X, LinkedIn, Instagram) | Footer links | ⬜ | ⬜ | ⬜ | Password manager |

## 2. Rules to apply

1. Every service has **at least two owners**, and 2FA is on for all of them.
2. Shared secrets go in a team password manager (not chat, not the repository).
3. When a position ends, access is removed the same week (handover process in [business processes](../../../03-business-domain/business-processes.md)).
4. Keys that were ever pasted in chat or committed are rotated.

## 3. Open items

| # | Item | Owner | Due |
| - | ---- | ----- | --- |
| 1 | Choose the password manager (Bitwarden free organisation recommended) | Project owner | Sprint 00 |
| 2 | Fill the table above | Project owner | Sprint 00 |
| 3 | Add a second owner to GitHub, Vercel and Supabase | Project owner | Sprint 00 |
