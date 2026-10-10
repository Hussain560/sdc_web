# Internal Screens — Canonical Data Model Reference

> The reconciled field set every internal screen draws from: which fields are **inputs** vs **read-only**, validation, **badge palettes**, and **allowed actions per status**. Database definitions live in [`05-database/entities`](../../05-database/entity-model.md); this file adds the UI view. If they disagree, the entity docs win and this file is corrected.

Badge tones map to semantic tokens ([colors §2](../foundations/colors.md#3-semantic-tokens-v2)): **neutral** (`--color-text-secondary` on `--color-surface-field`), **accent** (`--color-accent` on `--color-accent-soft`), **success**, **warning**, **danger**, **info**. Every badge carries text — color is never the only signal.

---

## 1. Event

KFUCS-aligned ([ADR-012](../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md)); captured by the [4-step wizard](./13-event-form.md).

### 1.1 Form fields (by wizard step)

| Step | Field | UI role | Required | Validation / notes |
| ---- | ----- | ------- | -------- | ------------------ |
| 1 | `committee_id` | select (only committees where the user holds `events.create`) | ✅ | Pre-selected/read-only with one committee |
| 1 | `type` | chip group | ✅ | workshop · bootcamp · hackathon · meeting · meetup · talk (*Q-040*) |
| 1 | `title_ar` / `title_en` | text | ar ✅ | 3–200 |
| 1 | `slug` | text (auto from title) | ✅ | `^[a-z0-9-]+$`, unique; locked after publish |
| 1 | `summary_ar/en`, `description_ar/en` | textarea / Markdown editor | — | ≤ 500 / ≤ 5000 |
| 2 | `schedule_type` | segmented | ✅ | single day · consecutive range · specific dates |
| 2 | `start_date`, `end_date`, dates list | date / date chips | ✅ start | range: end ≥ start; specific: ≥ 1, unique |
| 2 | `start_time`, `end_time` | time (Asia/Riyadh) | — | same day: end > start |
| 2 | `location_mode` | segmented | ✅ | in person · online · hybrid |
| 2 | `location_ar/en`, `map_url` | text | in person/hybrid | ≤ 500; `https://` |
| 2 | `meeting_url`, `meeting_notes` | text 🔒 private | — | URL when present; ≤ 1000 |
| 2 | `group_link` | text 🔒 private | ✅ to publish | URL (KFUCS rule) |
| 2 | `seats` | number / "unlimited" | — | > 0 |
| 2 | `registration_start_at`, `registration_end_at` | date-time | — | end after the first day's start |
| 2 | `requires_approval`, `waitlist_enabled`, `audience` | switch / switch / segmented | ✅ | *Q-018*, *Q-029*, *Q-009* |
| 3 | `cover_image` | upload | — | JPEG/PNG/WebP ≤ 2 MB, 16:9 |
| 3 | `goals` | bilingual list | ✅ ≥ 1 ar | ≤ 15 |
| 3 | `faq` | bilingual Q/A list | — | ≤ 15 |
| 3 | presenters | member search / guest form | — | ≤ 10; role presenter · mentor · judge · host |
| 3 | `details.*` | bilingual lists (collapsed) | — | ≤ 20 items, ≤ 300 chars |
| 3 | `certificate_available`, `awards_ar/en`, `contact_email`, `contact_phone` | — | — | email; E.164 |
| 4 | `display_config.*` | switches | — | show presenters / goals / FAQ / details / seats remaining; auto-close |
| 4 | `submission_note`, confirmation | textarea, checkbox | confirmation ✅ | — |
| — | `status`, `published_at`, `reviewed_by`, `review_note`, `attendance_finalized_at` | **read-only** | — | changed only by lifecycle actions |

### 1.2 Status badge (stored, editorial)

| Status | Tone | Label (ar / en) |
| ------ | ---- | --------------- |
| `draft` | neutral | مسودة / Draft |
| `pending_review` | warning | بانتظار الاعتماد / Pending review |
| `changes_requested` | danger | مطلوب تعديلات / Changes requested |
| `published` | success | منشورة / Published |
| `cancelled` | danger | ملغاة / Cancelled |
| `completed` | info | مكتملة / Completed |
| `archived` | neutral | مؤرشفة / Archived |

### 1.3 Phase chip (derived, published events only — KFUCS stores these, SDC derives them)

| Phase | Tone | Label |
| ----- | ---- | ----- |
| `announced` | warning | قريبًا / Coming soon |
| `registration_open` | accent | التسجيل متاح / Registration open |
| `registration_closed` | neutral | التسجيل مغلق / Registration closed |
| `in_progress` | info | جارية / In progress |
| `ended` | neutral | منتهية / Ended |

### 1.4 Allowed actions by status

| Status | Actions (subject to permission) |
| ------ | -------------------------------- |
| `draft` | Edit (wizard) · Submit for review (`events.submit`) · Approve & publish (`events.approve`, fast-track) · Delete (`events.delete`) |
| `pending_review` | Approve & publish · Request changes (`events.approve`) · Withdraw (`events.submit`) |
| `changes_requested` | Edit · Resubmit (`events.submit`) · Delete |
| `published` | Edit (significant changes notify) · Cancel (`events.cancel`) · Registrations · Attendance sessions · Complete (`events.complete`, after attendance finalization) |
| `cancelled` | View · Archive |
| `completed` | View · Certificates (*Q-020*) · Archive · attendance correction (`events.complete`, audited) |
| `archived` | View only |

### 1.5 Attendance session status

| Status | Tone | Label |
| ------ | ---- | ----- |
| `scheduled` | neutral | مجدولة / Scheduled |
| `open` | accent | مفتوحة / Open |
| `closed` | warning | مغلقة — بانتظار الاعتماد / Closed |
| `finalized` | success | مُعتمدة / Finalized |

---

## 2. Event registration

| Field | UI role | Notes |
| ----- | ------- | ----- |
| `full_name_snapshot`, `email_snapshot` | read-only | `dir="ltr"` for email |
| `was_member` / member badge | read-only | "عضو / Member" accent badge or "غير عضو / Non-member" neutral |
| `status` | read-only (changed by actions) | see palette |
| `decision_note` | input (in decision dialog) | ≤ 1,000, internal only |
| `attendance_result`, `attendance_percent` | read-only (written by attendance finalization) | attended · absent; percentage from `attendance_percent()` |
| `notify_status` | read-only | not sent · sending · sent · failed (claim-before-send, KFUCS) |
| Email delivery | read-only | sent · failed · not sent (from `email_logs`) |

| Status | Tone | Label |
| ------ | ---- | ----- |
| `pending` | warning | قيد المراجعة / Pending |
| `accepted` | success | مقبول / Accepted |
| `waitlisted` | info | قائمة الانتظار / Waitlisted |
| `rejected` | danger | مرفوض / Rejected |
| `cancelled` | neutral | ملغى / Cancelled |

Allowed: `pending` → accept · reject · waitlist; `waitlisted` → accept · reject; `accepted` → reject (warning: email already sent) · cancel; `rejected` → accept (reversal, audited).

---

## 3. Membership cycle

| Field | UI role | Required | Validation |
| ----- | ------- | -------- | ---------- |
| `name_ar` / `name_en` | input | ar ✅ | ≤ 150 |
| `description_ar/en` | input (Markdown) | — | ≤ 5,000 — shown on `/join` |
| `opens_at`, `closes_at` | input (date-time) | ✅ | closes > opens; must not overlap another published cycle (inline conflict message) |
| `review_ends_at` | input (date) | — | ≥ closes |
| `capacity` | input (number) | — | > 0 (*Q-011*) |
| `questions[]` | input (question builder: type text/long text/single choice/multi choice; required; ar/en labels) | — | ≤ 10 questions; locked once applications exist |
| `status` | read-only | — | draft · published · completed |

Derived phase chip: `draft` (neutral, مسودة) · `scheduled` (info, مجدولة) · `open` (accent, مفتوحة) · `closed` (warning, مغلقة — بانتظار القرارات) · `completed` (success, مكتملة).

Actions: draft → Publish schedule · Open now · Edit · Delete; scheduled → Edit · Open now · Unpublish; open → Extend · Close early; closed → Extend/re-open (before completion) · Complete (enabled when no undecided applications).

## 4. Membership application

| Field | UI role (reviewer) | Notes |
| ----- | ------------------ | ----- |
| Names, phone, academic status, university, major, sub-major, track, bio, links, answers | read-only | Links open in new tab, `rel="noopener noreferrer"` |
| `preferred_committee_id` | read-only | (*Q-013*) |
| `consent_at`, `consent_version` | read-only | shown in detail footer |
| `decision_note` | input (decision dialog) | internal only |
| `status` | read-only (actions) | palette below |

| Status | Tone | Label |
| ------ | ---- | ----- |
| `submitted` | warning | جديد / Submitted |
| `under_review` | info | قيد المراجعة / Under review |
| `accepted` | success | مقبول / Accepted |
| `waitlisted` | info | قائمة الانتظار / Waitlisted |
| `rejected` | danger | مرفوض / Rejected |
| `withdrawn` | neutral | مسحوب / Withdrawn |

Allowed: `submitted` → start review · accept · reject · waitlist; `under_review` → accept · reject · waitlist · release; `waitlisted` → accept · reject. A reviewer never sees decision actions on their own application.

## 5. Member

| Field | Member (self) | Leadership (`members.manage`) |
| ----- | ------------- | ----------------------------- |
| Names, academic status, university, major, sub-major, track, bio, links | input | read-only (corrections via the member, or edit with audit — *Q-030*) |
| `is_directory_visible` | input (switch) | read-only |
| `status` | read-only | action: suspend (reason) · reinstate · end membership (reason) |
| `joined_at`, `joined_via`, cycle | read-only | read-only |
| `legacy_claim_email` | — | input (legacy, unclaimed only) + "Send claim link" |

| Status | Tone | Label |
| ------ | ---- | ----- |
| `active` | success | نشط / Active |
| `suspended` | danger | موقوف / Suspended |
| `inactive` | neutral | غير نشط / Inactive |
| Unclaimed legacy (flag) | warning | لم يُطالَب به / Unclaimed |

## 6. Committee & role assignment

| Field | UI role | Validation |
| ----- | ------- | ---------- |
| Committee `name_ar/en`, `slug`, `description_ar/en`, `display_order`, `contact_email` | input | slug unique |
| Committee `status` | read-only (Deactivate / Reactivate actions) | — |
| Assignment `user` | input (user search — members only for committee roles) | — |
| Assignment `role` | input (select — only roles the actor may grant) | anti-escalation |
| Assignment `committee` | input (shown only for committee-scoped roles) | required then |
| `starts_at`, `ends_at` | input (date) | ends > starts |
| `display_title_ar/en` | input | e.g., "قائدة المشاريع" |
| `end_reason` | input (end-term dialog) | required |

Role badge tones: `system_admin` danger-outline · `founder` / `community_leader` / `advisor` accent · committee roles neutral with committee name.

## 7. Article

| Field | UI role | Validation |
| ----- | ------- | ---------- |
| `title_ar/en`, `excerpt_ar/en` | input | title ar ✅ ≤ 200; excerpt ≤ 500 |
| `body_ar/en` | input (Markdown editor, split preview) | ar ✅ ≤ 50,000 |
| `committee_id` | input (select in scope) | — |
| Authors | input (repeater: user search / committee byline / guest name) | ≥ 1 |
| Tags | input (multi-select + create if `reference_data.manage`) | ≤ 8 |
| `cover_image`, `resource_url` + label | input | `https://` |
| `reading_minutes`, `published_at` | read-only | computed |

| Status | Tone | Label |
| ------ | ---- | ----- |
| `draft` | neutral | مسودة / Draft |
| `in_review` | warning | قيد المراجعة / In review |
| `changes_requested` | danger | مطلوب تعديلات / Changes requested |
| `published` | success | منشور / Published |
| `archived` | neutral | مؤرشف / Archived |

## 8. Formatting rules (all screens)

| Data | Format |
| ---- | ------ |
| Dates | `Intl.DateTimeFormat(locale, { timeZone: 'Asia/Riyadh' })` — e.g., ٢٥ أكتوبر ٢٠٢٦ / 25 Oct 2026; relative ("منذ ٣ ساعات") in tables with absolute date in a tooltip |
| Counts | `tabular-nums`; Western digits (*Q-042*) |
| Emails, URLs, slugs, ids | `dir="ltr"`, monospace optional for ids |
| Empty values | "—" (never blank) |
