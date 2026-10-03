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
| **Status**          | ✅ Local scope complete 2026-10-03 — remaining: Q-006/Q-033 confirmation, visual baseline approval for the thread pages, staging deploy, demo |

## Sprint Objective

Committees write bilingual Markdown threads that go through review and publishing; the public thread pages read the database with the same look; the remaining notification templates and the e-mail retry job are complete.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| ART-001 | Write a bilingual article draft in Markdown ⛔ Q-006 | P0 | 5 | — | ✅ Done 2026-10-03 (bilingual editor with split preview, tags, authors: user, committee byline or guest, cover, resource link, computed reading time) |
| ART-002 | Review → publish → archive lifecycle | P0 | 5 | — | ✅ Done 2026-10-03 (draft → review → published → archived, request changes with note, restore; publishers are e-mailed on submit) |
| ART-003 | Public list/detail from DB; migrate six articles; redirects ⛔ Q-033 | P0 | 5 | — | ✅ Done 2026-10-03 (public list, detail, home block read `public_articles`; six threads migrated; `/articles/1…6` → 301; Arabic-only notice) |
| NOT-003 | Remaining notification templates; e-mail retry job | P1 | 5 | — | ✅ Done 2026-10-03 (`review.pending` and `committee.assigned` templates, backoff retry job for every mail family, admin e-mail log with retry) |

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

- [x] Script injection in Markdown is neutralized (unit test).
- [x] Old `/articles/1…6` URLs 301 to slugs.
- [ ] Visual check for the thread pages unchanged — **list and home match; the detail page differs by the computed reading time** (see Known Gaps; baseline refresh needs approval).
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [x] Draft → review → publish → appears in the home page block (automated: `tests/auth/articles.spec.ts`).
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Ramadan capacity | High | Medium | Keep NOT-003 as a stretch goal |

## References & Specifications

Read for this sprint (paths relative to `docs/`):

| Area | Documents |
| ---- | --------- |
| Module specs | [11-modules/articles](../../../11-modules/articles/README.md) · [11-modules/notifications](../../../11-modules/notifications/README.md) · [11-modules/administration](../../../11-modules/administration/README.md) · [11-modules/access-control](../../../11-modules/access-control/README.md) |
| Business rules | [03-business-domain/article-lifecycle](../../../03-business-domain/article-lifecycle.md) · [03-business-domain/notification-rules](../../../03-business-domain/notification-rules.md) |
| Data | [05-database/entities/content](../../../05-database/entities/content.md) · [05-database/entities/platform](../../../05-database/entities/platform.md) (`email_logs`) |
| Screens | [INTERNAL 21-articles](../../../10-design-system/INTERNAL-SCREENS/21-articles.md) · [INTERNAL 24-admin (e-mail log)](../../../10-design-system/INTERNAL-SCREENS/24-admin-audit-emails-settings.md) · [PUBLIC 05-articles-list](../../../10-design-system/PUBLIC-SCREENS/05-articles-list.md) · [PUBLIC 06-article-detail](../../../10-design-system/PUBLIC-SCREENS/06-article-detail.md) · [INTERNAL 02-sidebar-navigation](../../../10-design-system/INTERNAL-SCREENS/02-sidebar-navigation.md) |
| Decisions | [open questions](../../../90-decisions/open-questions.md) Q-006, Q-033, Q-035, Q-010, Q-017 · [ADR-004](../../../90-decisions/ADR-004-authorization-model.md) (permissions from the database) |
| Process | [definition of done](../../definition-of-done.md) · [AI agent skills and the frozen identity](../../../07-engineering/ai-agent-skills.md) |

Requirements: FR-ART-001…003, BR-ART-001…005, FR-NOT-001…003, BR-NOT-001…004.

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| Migrations | `20270131000000_articles.sql` (tags, articles, authors, tags per article with order, triggers for computed reading time / `published_at` once / slug lock / status guard, RLS, views `public_articles`, `dashboard_articles`, `article_authors_named`, `article_status_counts`, `save_article`, `transition_article`, `delete_article_draft`, cover uploads for article authors); `…100_legacy_articles.sql` (six threads, generated by `scripts/gen-legacy-articles.mjs`); `…200_article_helpers.sql` (author lookup); `…300_email_retry.sql` (`due_email_retries()`, view `admin_email_logs`) |
| pgTAP | `09_articles.sql` (69 assertions: legacy threads, role matrix, drafts hidden, lifecycle, locks, byline kinds, limits, deletion, audit) · `09_email_retry.sql` (18: backoff, attempt limit, non-retryable codes, delivered keys, derived states, access) — suite total 987 |
| Module | `src/modules/articles/` (types, schemas, messages, permissions, queries, public queries, actions, `ArticleEditor`, public list/detail views) · shared `src/components/markdown/MarkdownRenderer` (react-markdown, raw HTML dropped, images off, safe links) used by the editor preview and the public pages |
| Screens | `/dashboard/articles` (tabs with counts, filters, table), `/new`, `/[id]` (editor for authors, review view with checklist for others); public `/articles`, `/articles/[slug]`, home block |
| Notifications | `review.pending` (to committee publishers on submit), `committee.assigned` (on assign and handover); `retryEmailLog()` for registrations, applications, events, articles and assignments; `/api/cron/email-retry` runs `due_email_retries()`; `/dashboard/admin/emails` (state tabs, quota meter, per-row and "retry all") |
| Navigation | sidebar items *Threads* (committee and management) and *E-mail log* are live |
| Tests | 15 unit tests for the sanitizer and reading time, 2 template tests; E2E `articles.spec.ts` (member writes → head reviews, requests changes, publishes → list/detail/home in both languages → archive 404 → restore; permission-denied cases; mail to the head; 301s) and `emails.spec.ts` (retry, unrepeatable mail explained, no access, cron secret) |

### Decisions taken on the documented proposals
| Question | Implemented as | Where to change |
| -------- | -------------- | --------------- |
| Q-006 who writes / publishes | Committee roles write (`articles.create`); head, deputy and the leader publish (`articles.publish`); non-committee submissions not offered | role grants in the database |
| Q-033 label and bylines | Existing labels kept (list "Threads / الثريدات", detail "Articles / المقالات" — to be unified once confirmed); committee and guest bylines allowed | `ArticlesListView`, `ArticleDetailView` |
| Q-035 English content | Optional; Arabic body shown with a notice when missing | — |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Detail-page visual baseline | Reading time is now computed from the text (AR-5: words ÷ 200), so the six threads show 1–2 min instead of the typed 3–4 min; a few mobile detail screenshots also differ by sub-pixel text positions. The baselines need an approved refresh (`npm run e2e:update`) |
| Label unification (Q-033) | Needs the owner's answer; it changes visible public copy |
| Slug redirects | `article_slug_redirects` was not created: the slug locks at the first publish, and old numeric URLs resolve through `legacy_id` |
| Cron frequency | `vercel.json` runs the retry daily (Hobby plans allow nothing faster); the documented backoff (5 min · 30 min · 2 h) applies when the route is called more often (Pro cron `*/10 * * * *`, `pg_cron`, or an external scheduler) |
| `event.reminder` | Optional template (Phase 4), not built |
| Digest e-mail | `review.pending` is sent per submission, not as a digest |
| Image uploads in Markdown | Images are not rendered (cover only); decide with the design owner if inline images are wanted |
