# Module — Events

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 3A |

## 1. Purpose
Let committees author events, have them approved and published, and present them publicly with accurate timing — replacing three hardcoded copies.

## 2. Current state
Six events hardcoded in `src/data/allEvents.js`, `app/events/page.js` and `app/events/[id]/page.js`; string dates; status by translated label; unknown ids fall back to event 2.

## 3. Actors and permissions
See [permission catalog](../../06-security/permission-catalog.md) (`events.*`). Committee roles author within scope; the community leader approves (Q-005).

## 4. Requirements
FR-EVT-001…009.

## 5. Rules and lifecycle
[Event lifecycle](../../03-business-domain/event-lifecycle.md); BR-EVT-001…009.

## 6. Data
`events`, `event_private_details`, `event_dates`, `event_presenters`, `attendance_sessions`, `attendance_records`, `certificates` ([events entities](../../05-database/entities/events.md)); view `public_events`; functions `transition_event`, `finalize_event_attendance`, `attendance_percent`. Model and wizard follow KFUCS ([ADR-012](../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md)).

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/events` | Everyone | Upcoming/past tabs, filters (type, committee, format) |
| `/events/[slug]` | Everyone | Detail + registration island; legacy `/events/1…6` redirect |
| `/dashboard/events` | Committee roles, leader | Table by status; review queue for approvers |
| `/dashboard/events/new`, `/[id]/edit` | Committee roles | 4-step wizard (Identity · Logistics · Content · Review) with live preview card — [13-event-form](../../10-design-system/INTERNAL-SCREENS/13-event-form.md) |
| `/dashboard/events/[id]/attendance` | Committee roles | Attendance sessions, QR display, finalization, certificates — [16-event-attendance](../../10-design-system/INTERNAL-SCREENS/16-event-attendance.md) |
| `/events/[slug]/check-in` | Accepted registrants | QR / online self check-in |
| `/dashboard/events/[id]` | Committee roles, leader | Overview, transitions with history, links to registrations/attendance |

## 8. Server operations
| Operation | Authorization | Side effects |
| --------- | ------------- | ------------ |
| `createEventDraft`, `updateEvent`, `deleteDraft` | `events.create/edit/delete` in scope | Audit |
| `submitEvent`, `withdrawEvent` | `events.submit` in scope | Optional reviewer digest (Phase 4) |
| `approveEvent`, `requestEventChanges` | `events.approve` | Revalidate public pages; audit |
| `cancelEvent` | `events.cancel` | `event.cancelled` emails; revalidate |
| `completeEvent` | `events.complete` | Requires finalized attendance; audit |
| `openSession`, `closeSession`, `finalizeSession`, `recordAttendance` | `registrations.attendance` in scope | Audit on corrections |
| `finalizeEventAttendance`, `issueCertificates` | `events.complete` | Roll-up; certificate emails (Q-020) |
| `setEventPresenters`, `setEventDates` | `events.edit` in scope | Blocks removing dates with finalized sessions |
| `uploadEventCover` | `events.edit` in scope | Storage write |

## 9. Notifications
`event.cancelled`, `event.changed`, optional `event.reminder`, `review.pending`.

## 10. Edge cases
1. Published event date changes → accepted registrants notified (`event.changed`).
2. Event with TBA date → "Coming soon" badge; registration allowed only if a window is open.
3. Committee of an event deactivated → event remains; new edits require leader.
4. Cancelling an event with 0 registrations → no emails.
5. Timezone: event at 00:30 Riyadh time displays on the correct local date.

## 11. Testing
Unit: phase derivation, wizard step schemas (ported KFUCS cases). pgTAP: visibility by status/scope, transition guards, UNIQUE check-in, `attendance_percent` with removed dates. E2E J6 + wizard create → submit → approve.

## 12. Open questions
Q-005, Q-009, Q-020, Q-021, Q-040 (Q-019 answered by ADR-012).
