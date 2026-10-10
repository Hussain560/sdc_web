# Sprint 16 — Public Redesign II: Members and the Remaining Pages

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 16 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2027-05-09 (indicative, Q-S2) |
| **End Date**          | 2027-05-22 |
| **Phase / Milestone** | Phase 7 — Public redesign / M9 |
| **Target version**    | `v1.1.0` (M9 exit) |
| **Capacity**          | ~28 SP — planned 27 SP |
| **Team**              | Tech lead + volunteer developers; owner for consent decisions, copy and approvals |
| **Status**            | ⬜ Planned |

## Sprint Objective

The members section is rebuilt **privacy first**: per-field consent, opt-in photos and participation, nothing shown that a member didn't choose. Every remaining public page (events list, articles, about, committees with the new index, join, certificate, privacy, 404) is on Design System v2. The legacy public CSS is deleted, and `v1.1.0` ships with owner-approved baselines.

Specs: [04-members](../../../10-design-system/PUBLIC-SCREENS-V2/04-members.md), [03](../../../10-design-system/PUBLIC-SCREENS-V2/03-events-list.md), [06](../../../10-design-system/PUBLIC-SCREENS-V2/06-about.md), [07](../../../10-design-system/PUBLIC-SCREENS-V2/07-articles.md), [08](../../../10-design-system/PUBLIC-SCREENS-V2/08-committees.md), [09](../../../10-design-system/PUBLIC-SCREENS-V2/09-join.md), [10](../../../10-design-system/PUBLIC-SCREENS-V2/10-certificate.md), [11](../../../10-design-system/PUBLIC-SCREENS-V2/11-privacy-and-not-found.md).

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| RDS-020 | Directory consent model: per-field flags, opt-in photo, opt-in participation, committee slugs in the view | P0 | 5 | — | ⬜ ⛔ Q-M1–M4 defaults |
| RDS-021 | Members directory v2 (leadership + directory, search, filters, paging, states) | P0 | 5 | — | ⬜ |
| RDS-022 | Member profile v2 (identity, bio, committees and roles, articles, opt-in events) | P0 | 3 | — | ⬜ |
| RDS-023 | Events list v2 (segments, filter bar, paging) | P0 | 3 | — | ⬜ |
| RDS-024 | Articles list and reading page v2 | P1 | 3 | — | ⬜ |
| RDS-025 | Committees index (new) and committee page v2 | P1 | 2 | — | ⬜ |
| RDS-026 | About v2 | P1 | 1 | — | ⬜ ⛔ Q-A1 |
| RDS-027 | Join v2 (cycle panel, journey, stepper with the 1.5 s submit floor) | P0 | 2 | — | ⬜ |
| RDS-028 | Certificate verification v2 (print) | P1 | 1 | — | ⬜ |
| RDS-029 | Privacy and 404 v2; delete the legacy public CSS; baselines; release `v1.1.0` | P0 | 2 | — | ⬜ |

### Acceptance criteria per story

**RDS-020 — Consent model** (migration `<ts>_directory_consent.sql`)
- `members` gains `show_university`, `show_track`, `show_links`, `show_photo`, `show_participation` (booleans) and `photo_path`. Defaults for **already-listed** members follow the owner's answer to Q-M1 (assumed: keep showing what the single flag showed; photo and participation off).
- `member_directory` returns `university*`, `track*`, links and `photo_path` only when their flag is on; adds `committee_slugs` (per Q-M4); still filters `status = 'active' and is_directory_visible`.
- `member_public_articles` and `member_public_participation` views expose only ids for listed members who opted in.
- `/account/member-profile` gets the switches ("إظهار جامعتي / Show my university", …) with a live preview of the public card.
- pgTAP: an unlisted member is invisible in every public view; each flag off hides its column; anon can't read `members`.

**RDS-021 — Directory**
- Leadership from `current_positions`; directory from `member_directory` only; search `?q=`, filters committee / track / university in the URL, paging 24, count in a live region.
- States: loading, no leadership (hidden), empty, no results, error. No e-mail or phone in the HTML (asserted in a test).

**RDS-022 — Profile**
- 404 for unlisted, inactive or unknown ids (the same response as any unknown URL); old numeric ids redirect only while listed.
- Each block renders only with data and consent; own profile shows "Edit my profile".

**RDS-023 … RDS-028 — Pages**
- Each page follows its spec: sections, states (loading, empty, no results, error, not found), data source, and copy in both languages.
- Join: the cycle panel by phase; the application submit uses `withMinimumDuration` (1.5 s) and the result blocks; the draft keeps working.
- Certificate: `verify_certificate` only; unknown id → HTTP 404 page with the verify form; print stylesheet; `noindex`; the e-mail never rendered.
- Committees index: a new route `/committees`, added to the nav (RDS-010 hides the item until it exists).

**RDS-029 — Clean-up and release**
- Legacy public CSS files (`all-events.css`, `event-details.css`, `members.css`, …) and the legacy PNG icons are deleted; the hex allowlist from RDS-001 is empty.
- The visual baselines of every public route are approved by the owner and committed in `chore(visual)` PRs.
- Release notes for `v1.1.0`.

## Pull requests (in this order)

| PR | Content | Stories |
| -- | ------- | ------- |
| 1 | Consent migration + views + pgTAP | RDS-020 |
| 2 | Account switches + public-card preview | RDS-020 |
| 3 | Members directory v2 | RDS-021 |
| 4 | Member profile v2 | RDS-022 |
| 5 | Events list v2 | RDS-023 |
| 6 | Articles list + reading page v2 | RDS-024 |
| 7 | Committees index + committee page v2 | RDS-025 |
| 8 | About v2 | RDS-026 |
| 9 | Join v2 | RDS-027 |
| 10 | Certificate v2 | RDS-028 |
| 11 | Privacy + 404 v2 | RDS-029 |
| 12 | Delete legacy public CSS and icons; empty the hex allowlist | RDS-029 |
| 13 | `chore(visual)`: approved baselines (members, lists, remaining pages) | — |

## Page matrix

| Page | Components | Data read | States | Tests |
| ---- | ---------- | --------- | ------ | ----- |
| Members directory | Leadership cards, FilterBar, MemberCard, TagChip, BottomSheet, EmptyState, Skeleton, CtaBand | `current_positions`, `member_directory`, `tracks`, `universities`, `committees` | loading, empty, no results, error, leadership hidden | pgTAP (consent); Playwright: filters in URL, paging, live count, **no `@` or phone pattern in the HTML**; snapshots; axe |
| Member profile | Avatar, Badge, TextLink, ArticleCard (list), EventCard (list) | `member_directory`, `current_positions`, `member_public_articles`, `member_public_participation` | loading, 404, own profile, each block missing | Playwright: unlisted → 404, flags off → fields absent, own-profile button; snapshots |
| Events list | SegmentedToggle, FilterBar, EventCard, EmptyState, Skeleton | `public_events`, `committees` | loading, empty upcoming, no results, error, paging | Unit: filter → query mapping. Playwright: URL state survives reload and back; snapshots |
| Articles list | Search, TagChip, ArticleCard (featured + grid) | `public_articles`, `tags` | loading, empty, no results, error | Playwright + snapshots |
| Article page | Breadcrumb, Avatar, prose styles, ArticleCard | `public_articles`, `article_authors_named` | loading, 404, Arabic-only fallback on `/en` | Playwright: `lang="ar"` on the fallback body; snapshots |
| Committees index / page | Committee cards, SegmentedToggle, EventCard, ArticleCard | `committees`, `current_positions`, `public_events`, `public_articles` | loading, empty sections, 404 | Playwright + snapshots |
| About | FeatureCard, StatsRow (bento), leadership cards, CtaBand | `current_positions`, `public_stats`, catalogue copy | sections hidden without copy or data | Snapshots |
| Join | Cycle panel, Stepper, Field…, ResultDialog block | `membership_cycle_phase`, reference tables, `my_membership_application` | phases × 4, member, already applied, each submit result | Unit: phase → panel mapping; timing test (as T1–T4 of Sprint 15) for the submit; extend `tests/auth/membership.spec.ts` |
| Certificate | CertificateCard, Field | `verify_certificate` | valid, not found, loading, print | Playwright: 404 status for an unknown id, print emulation snapshot |
| Privacy, 404 | Prose, Alert, EmptyState-like block | Markdown source | review banner, member actions | Snapshots; 404 status code |

## Dependencies

| Dependency | Source | Status | Resolution |
| ---------- | ------ | ------ | ---------- |
| Q-M1–Q-M4 consent defaults | Owner | Pending | Defaults as written in [90-open-questions](../../../10-design-system/PUBLIC-SCREENS-V2/90-open-questions.md#2-data-gaps) |
| Q-A1 public about copy | Owner | Pending | About sections behind a flag |
| Q-031 legal review | Owner | Pending | Review banner stays |
| Sprint 15 done | — | Pending | — |

## Acceptance Criteria (sprint)

- [ ] pgTAP proves no unlisted member and no unconsented field is readable by anon.
- [ ] Every public route: AR/EN × dark/light, desktop and 360 px snapshots approved by the owner; zero serious/critical axe violations; no horizontal scroll at 320 px.
- [ ] No hex literal outside `primitives.css`; no legacy public CSS left.
- [ ] `v1.1.0` tagged and released to production after the owner's go.

## Sprint Review Checklist (demo script)

- [ ] As a member: turn "show my university" off → the directory card and profile lose it at once.
- [ ] As a visitor: an unlisted member's URL → 404; filters and search in the directory.
- [ ] Events list segments and filters; an article in English that falls back to Arabic.
- [ ] Join in each intake phase (seeded cycles) and a submitted application.
- [ ] Verify a real certificate id and an unknown one; print preview.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Consent defaults hide data people expect | Medium | Medium | Owner decides Q-M1; members get an e-mail about the new switches |
| Too many pages for one sprint | Medium | Medium | P1 pages (articles, committees, about, certificate) can slip to a Sprint 17 without blocking the release of the flagships |
| Baseline review fatigue | Medium | Low | Baselines approved per page in small PRs, not one giant diff |
