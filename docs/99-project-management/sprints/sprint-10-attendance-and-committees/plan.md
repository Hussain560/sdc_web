# Sprint 10 — Attendance Sessions, Certificates Model & Committee Management

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 10 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-02-14 |
| **End Date**        | 2027-02-27 |
| **Phase / Milestone** | Phase 4 — Internal Management & Reporting / M6 |
| **Target version**  | contributes to `v0.7.0` |
| **Capacity**        | ~22 SP (Ramadan) — planned 21 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ✅ Local scope complete 2026-10-03 — remaining: Q-020 answer (certificates are off until then), Q-004 (home committee tiles), staging deploy, demo |

## Sprint Objective

Organizers run per-day attendance sessions the KFUCS way — QR, online and manual check-in, session and event finalization with one canonical percentage — and completing an event requires finalized attendance. Certificates are generated behind a setting (Q-020). Committees are managed in the dashboard.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| REG-006 | Attendance sessions: open/close/finalize, QR + online + manual check-in, event finalization (ADR-012) | P0 | 8 | — | ✅ Done 2026-10-03 (sessions per scheduled day, QR rotating token, online and manual check-in, session and event sign-off, audited corrections, one percentage formula, completion gated on sign-off) |
| PUB-003 | `/events/[slug]/check-in` page | P0 | 3 | — | ✅ Done 2026-10-03 (`/events/[slug]/check-in` with every state of the blueprint; the code survives the sign-in redirect) |
| REG-008 | Certificates: eligibility, PDF, delivery + retry ⛔ Q-020 | P2 | 5 | — | ✅ Done 2026-10-03 (behind the `certificates_enabled` setting, default off: eligibility and frozen snapshot in the database, PDF with Arabic shaping, private bucket, e-mail with retry, public verification page, owner download) |
| CMT-003 | Committee management UI + public committee pages | P1 | 5 | — | ✅ Done 2026-10-03 (committee cards, create / edit / deactivate / reactivate / delete with the documented guards, roster with terms and history, add and end positions, public committee page) |

## Technical Tasks

1. **Migration** — `attendance_sessions`, `attendance_records` (UNIQUE), `attendance_percent()`, finalization functions, `certificates` ([events entities §6–8](../../../05-database/entities/events.md#6-attendance_sessions)).
2. **pgTAP** — port the KFUCS cases F-19, F-20, F-23 and F-36.
3. **Screens** — [16-event-attendance](../../../10-design-system/INTERNAL-SCREENS/16-event-attendance.md), [check-in page](../../../10-design-system/PUBLIC-SCREENS/12-new-public-pages.md#2-event-check-in-eventsslugcheck-in), [20-committees-management](../../../10-design-system/INTERNAL-SCREENS/20-committees-management.md).
4. **QR** — rotating HMAC token (30 s), verified on the server.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-020 certificates and threshold | Leadership | Pending |

## Acceptance Criteria

- [x] A concurrent double check-in creates one record.
- [x] Removing a scheduled day with a finalized session is blocked.
- [x] *Complete event* stays disabled until attendance is finalized.
- [x] The attendance percentage in the UI, reports and certificates is identical.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [x] Run a two-day event: QR check-in, manual marks, finalize, complete, certificates (automated: `tests/auth/attendance.spec.ts`).
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Ramadan capacity | High | Medium | Certificates are P2 and may slip to Sprint 11 |

## References & Specifications

Read for this sprint (paths relative to `docs/`):

| Area | Documents |
| ---- | --------- |
| Module specs | [11-modules/attendance](../../../11-modules/attendance/README.md) · [11-modules/committees](../../../11-modules/committees/README.md) · [11-modules/events](../../../11-modules/events/README.md) · [11-modules/registrations](../../../11-modules/registrations/README.md) · [11-modules/notifications](../../../11-modules/notifications/README.md) |
| Business rules | [03-business-domain/event-lifecycle §3a](../../../03-business-domain/event-lifecycle.md) · [03-business-domain/registration-lifecycle](../../../03-business-domain/registration-lifecycle.md) · [03-business-domain/committee-model](../../../03-business-domain/committee-model.md) · [03-business-domain/notification-rules](../../../03-business-domain/notification-rules.md) |
| Data | [05-database/entities/events §6–9](../../../05-database/entities/events.md) (sessions, records, certificates, functions) · [05-database/entities/platform](../../../05-database/entities/platform.md) (`site_settings`) |
| Screens | [INTERNAL 16-event-attendance](../../../10-design-system/INTERNAL-SCREENS/16-event-attendance.md) · [INTERNAL 20-committees-management](../../../10-design-system/INTERNAL-SCREENS/20-committees-management.md) · [PUBLIC 12-new-public-pages §2–3](../../../10-design-system/PUBLIC-SCREENS/12-new-public-pages.md) |
| Decisions | [ADR-012](../../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md) · [KFUCS alignment §5](../../../98-reference/kfucs-event-model-alignment.md) · [open questions](../../../90-decisions/open-questions.md) Q-004, Q-014, Q-019, Q-020 · [ADR-004](../../../90-decisions/ADR-004-authorization-model.md) |
| Process | [definition of done](../../definition-of-done.md) · [AI agent skills and the frozen identity](../../../07-engineering/ai-agent-skills.md) |

Requirements: FR-REG-006, FR-EVT-006, FR-CMT-001…005, FR-PUB-003; BR-REG-010, BR-ORG-001…007, BR-4.6 (KFUCS).

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| Migrations | `20270214000000_attendance.sql` (`site_settings`, sessions with a private QR secret, records with `UNIQUE (registration_id, session_id)`, `open/close/finalize_session`, `session_qr_token`, `check_in`, `check_in_context`, `event_attendance_overview`, `session_roster`, `record_attendance`, `correct_attendance`, `finalize_event_attendance`, `issue_certificates`, `verify_certificate`, `private.attendance_percent`, the dates guard; `sync_event_dates` and `save_event` now diff the schedule; `transition_event` refuses completion without sign-off); `…100_my_registrations_attendance.sql` (percentage and certificate in my registrations); `…200_committees_management.sql` (`save_committee`, `set_committee_status`, `delete_committee`, `committee_cards`) |
| pgTAP | `10_attendance.sql` (75: KFUCS F-19/F-20/F-23/F-36 ported, QR window, token-less online check-in, roles, corrections, roll-up, certificates, RLS, audit) · `10_committees.sql` (30) — suite total 1,138 |
| Module `attendance` | types, messages, queries, actions, `AttendanceOverview`, `SessionRoster`, `QrDisplay`, public `CheckInCard` and `CertificateView`, `certificates.tsx` (generate, store, deliver, retry), `pdf/CertificateDocument` (A4, IBM Plex Sans Arabic + Inter, verification QR) |
| Module `committees` | types in `queries.ts`, messages, actions, `CommitteeForm`, `CommitteeActions`, public `CommitteeView` |
| Screens | `/dashboard/events/[id]/attendance` (+ `/[sessionId]`, `/qr`), event tab *Attendance*, `/events/[slug]/check-in`, `/certificates/[id]`, `/api/certificates/[id]/pdf`, `/account/registrations` (percentage + certificate), `/dashboard/committees` (+ `/[id]`), `/committees/[slug]` |
| Notifications | `certificate.issued` template; certificate delivery plugs into `retryEmailLog()` |
| Navigation | sidebar items *Committees* (management) and *Committee members* (committee scope) are live |
| Tests | E2E `attendance.spec.ts` (two days: late-open confirmation, QR screen, wrong/expired code, manual marking, finalize, sign-off by the head only, complete gated, 2 certificates issued and mailed, real PDF, verification page, owner-only download, my registrations) and `committees.spec.ts` (create → edit → deactivate → public 404 → reactivate → delete, owned committee not deletable, head's own view, public page) |

### Decisions taken on the documented proposals
| Question | Implemented as |
| -------- | -------------- |
| Q-020 certificates | Setting `certificates_enabled` (default **false**) and `certificate_threshold` (default **70**); both live in `site_settings` and get their editor in Sprint 11 |
| Q-019 attendance | Answered by ADR-012: per scheduled day, QR / online / manual, sign-off before completion |
| Token-less check-in | Allowed only for online and hybrid events; in-person events need the code on screen |
| Absent vs attended | `attended` = at least one finalized session attended (the doc's Proposed rule); eligibility needs the threshold as well |
| Q-004 home tiles | Not touched: the home community sections stay as they are until the owner answers |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Settings editor | `certificates_enabled` / `certificate_threshold` are changed in the database until the Sprint 11 settings screen |
| Live updates | The QR screen polls every 10 s (counter) and rotates the token every 30 s; the sessions list refreshes on actions and reload, not by push |
| Row highlight on change | Not implemented (blueprint §6, optional) |
| Public committees list | There is a page per committee (`/committees/[slug]`) but no public index; the home tiles stay static (Q-004) |
| Public committee members | Only public positions (head, deputy) are shown: members' positions are not public (`is_public_position`) |
| Rate limiting | Check-in relies on the unique record and the rotating token; no per-IP limit yet (Sprint 12 hardening) |
| Certificate template review | The A4 template follows the light-theme palette; the owner has not reviewed it |

### Revision after review (2026-10-03)
Attendance, registrations and certificates moved into tabs of the event page with a public e-mail check-in and a 120-second QR, matching KFUCS — see [11-modules/attendance §17](../../../11-modules/attendance/README.md). The standalone `/dashboard/events/[id]/attendance/*` pages were removed.

### Revision after review — guests (2026-10-03)
Check-in works from the public QR page with the registered e-mail (no sign-in, throttled) and the certificate e-mail links to a public page where the PDF downloads (the certificate id is the key). See [attendance §17](../../../11-modules/attendance/README.md) and [ADR-013](../../../90-decisions/ADR-013-accounts-for-members-only.md).
