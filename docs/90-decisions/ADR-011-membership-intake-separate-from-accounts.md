# ADR-011 — Membership via Intake Cycles, Separate from Accounts

| Field | Value |
| ----- | ----- |
| **Status** | Accepted (business decision D-001); data design Proposed |
| **Date** | 2026-10-02 |
| **Related** | [Membership lifecycle](../03-business-domain/membership-lifecycle.md), [membership entities](../05-database/entities/membership.md), Q-002, Q-011, Q-012, Q-038 |

## Context
The stakeholder stated that joining the community does not happen through the account registration page: there is a dedicated membership page that opens and closes, about once a year. The codebase has no such page; member records are inserted manually and are not linked to accounts.

## Decision
- **Accounts** (any visitor, any time) and **membership** (only through an open intake cycle) are separate concepts and separate records.
- Intake is modelled as `membership_cycles` with open/close dates (phase derived from dates; at most one open), and `membership_applications` (one per user per cycle) reviewed by authorized reviewers.
- Acceptance atomically creates/reactivates a `members` row linked to the account.
- `/join` is the dedicated page; `/register` explicitly states it does not grant membership.
- Existing members are migrated as legacy records with a claim flow.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Membership flag set on sign-up | Contradicts D-001 |
| External form (e.g., Google Forms) + manual entry | No link to accounts, no audit, manual data entry, privacy risk |
| Application without an account (invite on acceptance) | Viable (Q-002); rejected as default because applicants could not track status and duplicates are harder to prevent |

## Consequences
- New module and tables (Phase 3B); the annual intake becomes a managed, auditable process.
- If Q-002 is answered "no account required", the application table gains contact fields and an invite step on acceptance — the cycle model stays the same.
