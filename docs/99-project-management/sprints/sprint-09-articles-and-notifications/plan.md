# Sprint 09 — Articles & Notifications Completion

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 09 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-01-31 |
| **End Date**        | 2027-02-13 |
| **Phase / Milestone** | Phase 3C — Articles & Notifications / M5 |
| **Target version**  | `v0.6.0` (M5 exit) |
| **Capacity**        | ~25 SP (Ramadan starts ≈ 2027-02-08: plan about 20 % less) — planned 20 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Committees write bilingual Markdown threads that go through review and publishing; the public thread pages read the database with the same look; the remaining notification templates and the e-mail retry job are complete.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| ART-001 | Write a bilingual article draft in Markdown ⛔ Q-006 | P0 | 5 | — | ⬜ |
| ART-002 | Review → publish → archive lifecycle | P0 | 5 | — | ⬜ |
| ART-003 | Public list/detail from DB; migrate six articles; redirects ⛔ Q-033 | P0 | 5 | — | ⬜ |
| NOT-003 | Remaining notification templates; e-mail retry job | P1 | 5 | — | ⬜ |

## Technical Tasks

1. **Screens** — [21-articles](../../../10-design-system/INTERNAL-SCREENS/21-articles.md); public [05-articles-list](../../../10-design-system/PUBLIC-SCREENS/05-articles-list.md) / [06-article-detail](../../../10-design-system/PUBLIC-SCREENS/06-article-detail.md).
2. **Markdown** — one sanitized renderer shared by the editor preview and public pages.
3. **Retry** — scheduled job (Vercel Cron or `pg_cron`) for failed e-mails, idempotent.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-006 who publishes, Q-033 public label | Leadership | Pending |

## Acceptance Criteria

- [ ] Script injection in Markdown is neutralized (unit test).
- [ ] Old `/articles/1…6` URLs 301 to slugs.
- [ ] Visual check for the thread pages unchanged.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Draft → review → publish → appears in the home page block.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Ramadan capacity | High | Medium | Keep NOT-003 as a stretch goal |

## References & Specifications

- [Article lifecycle](../../../03-business-domain/article-lifecycle.md)
- FR-ART-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
