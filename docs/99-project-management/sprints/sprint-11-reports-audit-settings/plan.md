# Sprint 11 — Reports, Audit Log, Exports & Settings

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 11 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-02-28 |
| **End Date**        | 2027-03-13 |
| **Phase / Milestone** | Phase 4 — Internal Management & Reporting / M6 |
| **Target version**  | `v0.7.0` (M6 exit) |
| **Capacity**        | ~22 SP (Eid al-Fitr ≈ 2027-03-09) — planned 20 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ✅ Local scope complete 2026-10-03 — remaining: owner answers on Q-008 (final KPI catalogue), Q-021 (partners), Q-006/Q-033 confirmations, staging deploy, demo |

## Sprint Objective

Leadership and committee heads see dashboards built on one set of report functions; the audit log, e-mail log, reference data and site settings are manageable without developers; registrant exports are audited.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| RPT-001 | Community dashboard ⛔ Q-008 | P0 | 5 | — | ✅ |
| RPT-002 | Committee dashboard | P0 | 3 | — | ✅ |
| ACC-005 | Audit log UI | P0 | 3 | — | ✅ |
| ACC-006 | Reference data and site settings UIs | P1 | 3 | — | ✅ |
| REG-007 | Registrant export (audited) | P1 | 3 | — | ✅ |
| PUB-001 | Partners section ⛔ Q-021 | P2 | 3 | — | ✅ |

## Technical Tasks

1. **Functions** — `community_stats`, `committee_stats` per the [reporting model](../../../03-business-domain/reporting-model.md).
2. **Screens** — [10-dashboard-overview](../../../10-design-system/INTERNAL-SCREENS/10-dashboard-overview.md), [22-reports](../../../10-design-system/INTERNAL-SCREENS/22-reports.md), [24-admin](../../../10-design-system/INTERNAL-SCREENS/24-admin-audit-emails-settings.md).
3. **Footer** social links read `site_settings` (visual check unchanged).

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-008 KPIs, Q-021 partners | Leadership | Pending |

## Acceptance Criteria

- [ ] Report numbers match SQL spot checks on seed data.
- [ ] Every export writes an audit row with the filter used.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Leader dashboard vs committee-head dashboard for the same period.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Eid holiday | High | Low | Plan about 1.5 weeks of work |

## References & Specifications

Read for this sprint (paths relative to `docs/`):

| Area | Documents |
| ---- | --------- |
| Module specs | [11-modules/reports](../../../11-modules/reports/README.md) · [11-modules/administration](../../../11-modules/administration/README.md) · [11-modules/notifications](../../../11-modules/notifications/README.md) · [11-modules/attendance](../../../11-modules/attendance/README.md) |
| Business rules | [03-business-domain/reporting-model](../../../03-business-domain/reporting-model.md) (metric catalogue, periods RP-1…, privacy masking) |
| Screens | [INTERNAL 10-dashboard-overview](../../../10-design-system/INTERNAL-SCREENS/10-dashboard-overview.md) · [INTERNAL 22-reports](../../../10-design-system/INTERNAL-SCREENS/22-reports.md) · [INTERNAL 24-admin-audit-emails-settings](../../../10-design-system/INTERNAL-SCREENS/24-admin-audit-emails-settings.md) · [PUBLIC 01-home](../../../10-design-system/PUBLIC-SCREENS/01-home.md) (partners strip) |
| Data | [05-database/entities/platform](../../../05-database/entities/platform.md) (`site_settings`, audit) · [05-database/entities/events](../../../05-database/entities/events.md) |
| Decisions | [ADR-004](../../../90-decisions/ADR-004-authorization-model.md) · [open questions](../../../90-decisions/open-questions.md) Q-008, Q-021 · [AI agent skills and the frozen identity](../../../07-engineering/ai-agent-skills.md) |
| Process | [definition of done](../../definition-of-done.md) |

Requirements: FR-RPT-001…003, FR-ADM-001…006, FR-REG-007, FR-PUB-001.

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| Migrations | `20270228000000_reports.sql` (`private.report_metrics`, `report_period`, `mask_small`; `community_stats`, `committee_stats`, `pending_queues`, `dashboard_summary`, `my_activity`); `20270228000100_admin_tools.sql` (`list_audit_logs`, `audit_facets`, `record_export` with a filter, `save_site_settings` with per-key validation, `partners` + `save_partner`/`delete_partner`, `save_tag`/`delete_tag`/`tag_usage`) |
| pgTAP | `11_reports.sql` (54: every metric against a fixture with known answers, periods, scope, masking, queues) · `11_admin_tools.sql` (42: audit reader, export filter, settings validation, partners, tags) |
| Module `reports` | types, period parsing, queries, `MetricTile`, `BarList`, `MonthlyColumns` (CSS bars with a "view as table" disclosure), `PeriodPicker` |
| Module `admin` | messages, actions, queries, public partners loader, `SettingsForm`, `PartnersManager`, `TagsTable` |
| Screens | `/dashboard` (role-aware overview), `/dashboard/reports`, `/dashboard/reports/committees/[id]`, `/dashboard/admin/audit` (+ CSV export), `/dashboard/admin/settings` (General, Partners), reference data tab *Thread tags* |
| Public site | Footer social links and rights text read `site_settings` (defaults equal the old values, cached, revalidated on save); the home partners strip reads `partners` and is hidden when none is active |
| Exports | Registrations, membership and audit exports record the filter used next to the row count |
| Tests | E2E `reports-admin.spec.ts` (overview, community and committee reports, head redirect, audit denied for a leader, settings validation → footer → audit row, partners add/delete, tag rename) |

### Decisions taken on the documented proposals
| Question | Implemented as |
| -------- | -------------- |
| Q-008 KPIs | The proposed metric catalogue; default period is the last 12 months (no membership year is defined yet); groups under 5 people show "<5"; no public statistics |
| Q-021 partners | A `partners` table managed in settings; the section is hidden while empty. The local seed holds 12 placeholders so the visual baselines keep their cards; production starts empty |
| Footer text | Only the social links and an optional rights text are configurable; the rest of the footer stays as designed (D-009) |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Charts | CSS bars and columns only (no chart library); no funnel graphic beyond the bar list |
| Report export | The dashboards have no CSV export; only registrations, membership and audit exports exist |
| Partner logos | Logos are https links; there is no upload yet (a storage bucket can follow) |
| Account activity page | The overview's "My activity" card covers it; there is no separate `/account/activity` |
| Cron | The e-mail retry cron is daily because of the Hobby plan limit (see Sprint 09) |
