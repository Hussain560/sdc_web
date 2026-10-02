# Module — Public Site

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 3 (pages from DB), 4 (settings, partners) |

## 1. Purpose
The community's public face: identity, vision, leadership, committees, upcoming events, latest articles, members teaser and partners — server-rendered, bilingual, discoverable.

## 2. Current state
Home, about, 404 and section components are hardcoded and client-rendered; partners and member avatars are placeholders; header search leads to a missing `/search`; "Community sections" list conflicts with committees ([audit §3](../../01-project/current-system-audit.md#3-application-structure), Q-004).

## 3. Actors and permissions
Everyone reads. Content comes from other modules (events, articles, committees, role assignments, members). Site settings: `settings.manage`.

## 4. Requirements
FR-PUB-001…008, NFR-PERF-001…005, NFR-I18N-*, NFR-A11Y-*.

## 5. Rules
Only published content is shown (BR-EVT-008, BR-ART-001); leadership from active public positions (BR-ORG-001); directory only opted-in active members (BR-MBR-009).

## 6. Data
Views: `public_events`, `public_articles`, `current_positions`, `member_directory`; `committees`; `site_settings`.

## 7. Routes and screens
| Route | Purpose | Key states |
| ----- | ------- | ---------- |
| `/` | Hero, upcoming events (max 3), latest articles (max 6), committees, members teaser, partners | No upcoming events → show latest past events with "Ended" |
| `/about` | Description, vision, mission (from settings or static bilingual content) | — |
| `/members` | Leadership (from positions) + directory | No visible members |
| `/committees/[slug]` | Committee page (Phase 4) | Inactive committee |
| 404 | Localized not-found | — |

Legacy redirects: `/members/all` → `/members`.

## 10. Edge cases
1. English content missing → Arabic fallback marked `lang="ar"`.
2. A leader's term ends → disappears from leadership automatically at `ends_at`.
3. Cached pages after an event is published → revalidated by tag on publish.

## 11. Testing
E2E J1, J10; axe on home/about/members in both locales/themes.

## 12. Open questions
Q-004 (sections vs committees), Q-008 (public stats), Q-015 (vision), Q-021 (partners), Q-023 (search).
