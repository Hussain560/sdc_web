# Module — Members & Directory

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 3B (directory/profile), 4 (management) |

## 1. Purpose
Maintain member records and present a privacy-respecting public directory and member profiles; let members manage their own profile.

## 2. Current state
`members` table with bilingual free-text fields, readable **and writable** by anyone, not linked to accounts; leadership hardcoded above the directory; filters built client-side; fake contact form ([audit](../../01-project/current-system-audit.md)).

## 3. Actors and permissions
| Actor | Can | Key |
| ----- | --- | --- |
| Everyone | View directory and visible profiles | — |
| Member | Edit own profile, toggle visibility | ownership |
| Leader / admin | View all, change status, manage legacy records and claims | `members.view`, `members.manage` |

## 4. Requirements
FR-MEM-001…007.

## 5. Rules
BR-MBR-009…011; member states in [membership lifecycle §4](../../03-business-domain/membership-lifecycle.md#4-member-عضو).

## 6. Data
`members`, reference tables ([membership entities](../../05-database/entities/membership.md), [reference data](../../05-database/entities/reference-data.md)); view `member_directory`; function `claim_legacy_member`.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/members` | Everyone | Leadership + filterable directory (filters in URL) |
| `/members/[id]` | Everyone | Public profile (404 if not visible) — legacy numeric ids redirect via `legacy_id` |
| `/account/profile` | Member | Edit profile and visibility |
| `/claim/[token]` | Legacy member | Claim an existing profile |
| `/dashboard/members` | Leader/admin | Search, view, status changes, claim emails |

## 10. Edge cases
1. Member hides profile → disappears from directory and profile URL returns 404.
2. Suspended member → hidden; committee roles ended (BR-MBR-011).
3. Unclaimed legacy profile → displayed per current visibility until the cut-off decided in Q-026.
4. Social link not `https://` → rejected with field error.

## 11. Testing
pgTAP: directory view exposes only public columns of visible active members; owner-only updates; status changes require `members.manage`. E2E: J5 (visibility opt-in).

## 12. Open questions
Q-004, Q-007, Q-012, Q-022, Q-026, Q-030.
