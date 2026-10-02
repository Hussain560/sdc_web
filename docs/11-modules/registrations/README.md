# Module — Event Registrations & Attendance

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 3A (registration & review), 4 (attendance, export) |

## 1. Purpose
Let users register for events once, let scoped organizers review registrations and record attendance, and keep participants informed — replacing the single global "committee" page.

## 2. Current state
Browser inserts into `event_registrations` with open policies; duplicates possible; global reviewer by email list; member/visitor badge by name match; emails fired from the browser.

## 3. Actors and permissions
Participant (ownership), organizers with `registrations.review` / `registrations.attendance` / `registrations.export` in the event's committee scope.

## 4. Requirements
FR-REG-001…008.

## 5. Rules and lifecycle
[Registration lifecycle](../../03-business-domain/registration-lifecycle.md); BR-REG-001…010.

## 6. Data
`event_registrations` ([events entities](../../05-database/entities/events.md)); view `event_registration_counts`; functions `register_for_event`, `cancel_registration`, `decide_registrations`, `record_attendance`.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/events/[slug]` (island) | Signed-in user | Register / status / cancel |
| `/account/registrations` | Signed-in user | My registrations (upcoming/past) |
| `/dashboard/events/[id]/registrations` | Organizers in scope | Counts, filters, member badge, bulk decide, email status, export |
| `/dashboard/events/[id]/attendance` | Organizers in scope | Attendance sessions per day: QR / online / manual check-in, finalize (ADR-012) |
| `/committee` (legacy) | — | Redirect to `/dashboard/events` |

## 9. Notifications
`registration.received`, `registration.confirmed`, `registration.rejected`, `registration.waitlisted`, `registration.cancelled_by_organizer`.

## 10. Edge cases
1. Double-click on Register → one row (unique constraint), second call returns `ALREADY_REGISTERED`.
2. Two reviewers accept the last seat simultaneously → capacity lock in `decide_registrations` lets one succeed.
3. Accept after an acceptance email was sent then reject → allowed with warning; `registration.rejected` sent (Q-028 wording).
4. User cancels then re-registers while open → the same row is reactivated to `pending`/`accepted`.
5. Event cancelled → registrations remain for history; participants notified.
6. Legacy registrations whose `user_id` no longer exists → migrated with snapshots only.

## 11. Testing
pgTAP: uniqueness, phase guard, members-only guard, scope isolation, capacity concurrency. Integration: decision → email log. E2E J3, J4.

## 12. Open questions
Q-009, Q-018, Q-019, Q-028, Q-029.
