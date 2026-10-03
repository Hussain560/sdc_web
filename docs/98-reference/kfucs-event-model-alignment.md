# KFUCS → SDC Event Model Alignment

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft — implements [ADR-012](../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md) |
| **Source**       | `kfucs-portal` as of 2026-10-01: `src/hooks/useEventWizard.ts`, `src/components/admin-events/wizard/*`, `src/lib/validations/admin-event.ts`, `src/types/admin-engine.ts`, migrations `20260916`–`20261001` |

This page maps the KFUCS event model **field by field** to SDC so that the two products behave the same for the organizers who use both. Each row is marked: **Same**, **Adapted** (with the reason) or **Dropped**.

## 1. Wizard steps

| # | KFUCS step (ar / en) | Fields | SDC |
| - | -------------------- | ------ | --- |
| 1 | الهوية / Identity | title ar/en, type, committee, description ar/en | **Same**, plus the SDC slug (auto-generated) and summary; Arabic title required |
| 2 | التفاصيل / Logistics | schedule type, dates, times, location mode, location ar/en, meeting URL + notes, group link, seats, registration deadline | **Same** |
| 3 | المحتوى / Content | goals ar/en, FAQ, presenters, cover image | **Same**, plus optional SDC detail blocks (target audience, requirements, responsibilities, deliverables, benefits), awards and contact |
| 4 | المراجعة / Review | display toggles, preview card, confirmation checkbox | **Same**; the submit button depends on permission (*Submit for review* or *Approve & publish*) |

Wizard behaviour is the **same** as KFUCS:
- Per-step validation runs before *Next*.
- Completed steps can be clicked to go back; future steps cannot be skipped.
- State is persisted in `localStorage` under a per-user, per-event key, so a refresh resumes on the same step. It is cleared when the event is saved.
- *Save draft* is available on every step.
- The preview card updates live.

## 2. Fields

| KFUCS field | Type | SDC column | Status |
| ----------- | ---- | ---------- | ------ |
| `title_en` (required, 5–200) / `title_ar` | text | `title_ar` (required, 3–200) / `title_en` | Adapted — Arabic-first |
| `type` `WORKSHOP·BOOTCAMP·HACKATHON·MEETING` | enum | `type` + `meetup`, `talk` | Adapted — **OPEN Q-040** |
| `committee_id` | uuid | `committee_id` | Same (permission-scoped list) |
| `academic_semester_id` | uuid | — | Dropped |
| `description_en/ar` (≤ 5000) | text | `description_ar/en` (≤ 5000, Markdown) | Same |
| — | — | `slug`, `summary_ar/en` | SDC addition (public URLs, cards) |
| `schedule_type` `SINGLE_DAY·CONSECUTIVE_RANGE·SPECIFIC_DATES` | enum | `schedule_type` | Same |
| `start_date`, `end_date`, `dates_array[]` | date | `start_date`, `end_date`, `event_dates` (child table) | Adapted — a child table instead of an array, so that attendance sessions can reference dates by foreign key (KFUCS F-20 orphan sessions) |
| `start_time`, `end_time` | time | same (Asia/Riyadh) | Same |
| `location_mode` `IN_PERSON·ONLINE·HYBRID` | enum | `location_mode` | Same |
| `location_en/ar` | text ≤ 500 | `location_ar/en` + `map_url` | Same + map link (current SDC pages show one) |
| `meeting_url`, `meeting_notes` | text | `event_private_details.meeting_url / meeting_notes` | Same values; stored in a private table because the event row is public (RLS is row-level) |
| `group_link` (required, URL) | text | `event_private_details.group_link` (required to publish) | Same rule; private |
| `seats` | int, nullable | `seats` | Same |
| `registration_end_at` | timestamptz | `registration_end_at` (+ optional `registration_start_at`) | Same + opening time (SDC sometimes announces before opening) |
| `goals_en/ar[]` (≥ 1 English goal, ≤ 15) | text[] | `goals` jsonb `{ar[], en[]}` (≥ 1 Arabic goal, ≤ 15) | Adapted — Arabic-first |
| `faq[] {q_en,q_ar,a_en,a_ar}` (≤ 15) | jsonb | `faq` (same shape, ≤ 15) | Same |
| `presenter_ids[]` (≤ 10) | uuid[] | `event_presenters (event_id, profile_id \| guest name, role, sort)` | Adapted — SDC presenters can be guests without accounts |
| `image_url` | text | `cover_image_path` (Storage) | Same purpose |
| `display_config {show_presenters, show_goals, show_faq, show_seats_remaining, auto_close_registration}` | jsonb | `display_config` (same keys) + `show_details` | Same + SDC detail blocks toggle |
| — | — | `details` jsonb (target audience, requirements, responsibilities, deliverables, benefits) | SDC addition (current pages) |
| — | — | `awards_ar/en`, `contact_email`, `contact_phone` | SDC addition (current pages) |
| `submission_notes`, `rejection_note`, `submitted_at`, `approved_by/at` | — | `submission_note`, `review_note`, `submitted_at`, `reviewed_by/at` | Same |
| `attendance_finalized_at/by` | — | same | Same (F-36) |

## 3. Status lifecycle

| KFUCS status | Stored? | SDC | Label (ar / en) |
| ------------ | ------- | --- | --------------- |
| `DRAFT` | yes | `draft` (stored) | مسودة / Draft |
| `PENDING_REVIEW` | yes | `pending_review` (stored) | بانتظار الاعتماد / Pending review |
| `REJECTED` | yes | `changes_requested` (stored) | مطلوب تعديلات / Changes requested |
| `PUBLISHED` | yes | `published` (stored), phase *registration open* or *coming soon* | منشورة / Published |
| `REGISTRATION_CLOSED` | yes (sweep) | **derived** phase of `published` | التسجيل مغلق / Registration closed |
| `IN_PROGRESS` | yes (sweep) | **derived** phase of `published` | جارية / In progress |
| `COMPLETED` (requires finalized attendance since F-36) | yes | `completed` (stored, set by *Complete event*, which requires attendance finalization when sessions exist) | مكتملة / Completed |
| `ARCHIVED` | yes | `archived` (stored; hidden from public listings, URL still resolves) | مؤرشفة / Archived |
| — | — | `cancelled` (stored; reason required; registrants notified) | ملغاة / Cancelled |

KFUCS reopens registration on an `IN_PROGRESS` event by extending `registration_end_at`. SDC keeps the same rule: the deadline only has to be **after the start of the first day**, not before the event starts.

## 4. Registration, attendance, certificates

| Concern | KFUCS logic | SDC |
| ------- | ----------- | --- |
| Decision axis | `acceptance_status` PENDING/ACCEPTED/REJECTED, separate from `status` (F-06) | `event_registrations.status` (pending/accepted/rejected/waitlisted/cancelled) — the decision axis only |
| Attendance axis | per-session `attendance_records`, roll-up to Attended/Absent on finalization | `attendance_records` per session; registration roll-up `attendance_result` (attended/absent) written on finalization |
| Sessions | one `attendance_session` per scheduled date | `attendance_sessions (event_id, event_date_id, opened_at, finalized_at)` |
| Check-in methods | QR (rotating token), ONLINE (self check-in during window), MANUAL | Same three; QR and online self check-in only while the session is open |
| Duplicates | UNIQUE (registration_id, session_id) (F-23) | Same |
| Percentage | one function: attended ÷ **finalized sessions on the current schedule** (F-19) | `attendance_percent(registration_id)` — same definition |
| Completion | `COMPLETED` only after `attendance_finalized_at` (F-36) | Same |
| Certificates | eligibility ≥ 70 %, frozen snapshot (percent, attended, expected), PDF in Storage, delivery status + retry | Same model; **threshold and whether to issue are OPEN Q-020** |
| Email | per-recipient outbox (`email_logs`), `notify_status` on the registration, retry, claim-before-send | `email_log` per recipient ([email architecture](../04-architecture/email-architecture.md)); same claim-before-send |
| Cancel registration | soft cancel (F-27) | Same |
| Waitlist | value allowed, no promotion workflow | Same: allowed, promotion manual (**OPEN Q-029**) |

## 5. KFUCS audit lessons built in from day one

| KFUCS finding | What went wrong there | SDC rule |
| ------------- | --------------------- | -------- |
| F-04 | Free-text status next to an unused enum | `CHECK` constraint on day one; one status list in code generated from the DB |
| F-06 / F-07 | Decision and attendance in one column; no "accepted" state | Two axes from the start |
| F-19 | Three different attendance-percentage formulas | One SQL function, used by the UI, reports and certificates |
| F-20 | Sessions orphaned when the schedule changed | Sessions reference `event_dates` by FK; removing a date with recorded attendance is blocked |
| F-23 | Duplicate check-ins via a racy read-then-insert | UNIQUE constraint + `insert … on conflict do nothing` |
| F-29 | Email log never written | Every send writes exactly one row (single send function) |
| F-36 | "Completed" meant "the calendar moved on" | Completion requires finalization |
| F-53 | Eight drifting copies of role arrays | Permissions from the database ([ADR-004](../90-decisions/ADR-004-authorization-model.md)) |
| meeting_url CHECK (2026-09-16) | A `NOT VALID` constraint blocked unrelated updates on old rows | Conditional requirements (meeting URL, group link) are validated in the wizard/server action when **publishing**, not as table CHECKs |
