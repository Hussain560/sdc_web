# Entities — Membership

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) — details pending **OPEN Q-002, Q-007, Q-011, Q-012, Q-013** |

Business rules: [membership lifecycle](../../03-business-domain/membership-lifecycle.md), BR-MBR-*.

## 1. `membership_cycles`

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK | P | — |
| `name_ar`, `name_en` | text | no / yes | ≤ 150 | P | e.g., "استقبال طلبات العضوية 2026" |
| `description_ar`, `description_en` | text | yes | ≤ 5000 | P | Eligibility and instructions shown on `/join` |
| `opens_at`, `closes_at` | timestamptz | no | CHECK `closes_at > opens_at` | P | Window |
| `closed_early_at` | timestamptz | yes | — | P | Manual early close |
| `review_ends_at` | timestamptz | yes | — | I | Target decision date |
| `capacity` | integer | yes | CHECK `> 0` | I | Optional cap on acceptances |
| `questions` | jsonb | no | `'[]'`, CHECK array | P | Extra questions: `[{ key, type, required, label_ar, label_en, options? }]` |
| `status` | text | no | `'draft'`; CHECK in (`draft`,`published`,`completed`) | I | Stored editorial state |
| `created_by`, `created_at`, `updated_at` | — | — | standard | I | — |

Derived phase (view `membership_cycle_phase`): `draft` → `scheduled` (published, now < opens_at) → `open` (published, opens_at ≤ now < coalesce(closed_early_at, closes_at)) → `closed` → `completed`.

Constraint for BR-MBR-003: `exclude using gist (tstzrange(opens_at, closes_at) with &&) where (status <> 'draft')` — published cycles cannot overlap, so at most one is open.

RLS: anyone reads published/completed cycles (public columns); `membership.manage_cycles` for insert/update.

## 2. `membership_applications`

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK | R | — |
| `cycle_id` | uuid | no | FK → `membership_cycles` RESTRICT | R | — |
| `user_id` | uuid | no | FK → `profiles` RESTRICT | R | Applicant (**OPEN Q-002**: account required — assumed yes) |
| `status` | text | no | `'submitted'`; CHECK in (`submitted`,`under_review`,`accepted`,`rejected`,`waitlisted`,`withdrawn`) | R | — |
| `full_name_ar`, `full_name_en` | text | no / yes | — | R | Snapshot at submission |
| `phone` | text | yes | E.164 | R | **OPEN Q-011** |
| `academic_status` | text | no | CHECK in (`student`,`graduate`,`employee`,`other`) | R | — |
| `university_id` | smallint | yes | FK → `universities` | R | — |
| `major_id`, `sub_major_id` | smallint | yes | FK → `majors` | R | — |
| `track_id` | smallint | yes | FK → `tracks` | R | — |
| `preferred_committee_id` | uuid | yes | FK → `committees` | R | **OPEN Q-013** |
| `bio_ar`, `bio_en` | text | yes | ≤ 1000 | R | — |
| `portfolio_url`, `github_url`, `linkedin_url`, `x_url` | text | yes | `^https://` | R | — |
| `answers` | jsonb | no | `'{}'` | R | Answers to cycle questions (validated against `questions`) |
| `wants_directory_listing` | boolean | no | false | R | Directory opt-in carried to the member record |
| `consent_at`, `consent_version` | timestamptz, text | no | — | R | Privacy notice acceptance |
| `submitted_at` | timestamptz | no | now() | R | — |
| `reviewer_id` | uuid | yes | FK → `profiles` | R | Who claimed it (`under_review`) |
| `decided_by`, `decided_at` | uuid, timestamptz | yes | — | R | — |
| `decision_note` | text | yes | ≤ 1000 | R (internal only) | Never shown to the applicant |
| `withdrawn_at` | timestamptz | yes | — | R | — |
| `created_at`, `updated_at` | — | — | standard | R | — |

Constraints: UNIQUE (`cycle_id`, `user_id`); insert allowed only when the cycle phase is `open` (checked in `submit_membership_application` and an insert policy `with check (private.cycle_is_open(cycle_id))`).

Indexes: `(cycle_id, status)`, `(user_id)`.

RLS: applicant reads own; applicant updates own while `submitted` and cycle open (restricted columns only — enforced by function, direct UPDATE not granted); `membership.review` reads/decides all in cycle.

## 3. `members`

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK | P | Public profile URL key |
| `legacy_id` | integer | yes | UNIQUE | I | Old `members.id` (redirect `/members/10`) |
| `user_id` | uuid | yes | UNIQUE, FK → `profiles` RESTRICT | I | Null for unclaimed legacy records |
| `status` | text | no | `'active'`; CHECK in (`active`,`inactive`,`suspended`) | I | — |
| `status_reason` | text | yes | — | I | Required for `suspended` (trigger) |
| `joined_at` | timestamptz | no | now() | P | — |
| `joined_cycle_id` | uuid | yes | FK → `membership_cycles` | I | — |
| `joined_via` | text | no | CHECK in (`application`,`legacy`,`manual`) | I | — |
| `application_id` | uuid | yes | FK → `membership_applications` | I | Source application |
| `first_name_ar`, `last_name_ar` | text | no | — | P | Display name (current UI shows first + last) |
| `first_name_en`, `last_name_en` | text | yes | — | P | — |
| `academic_status` | text | yes | CHECK in (`student`,`graduate`,`employee`,`other`) | P | — |
| `university_id`, `major_id`, `sub_major_id`, `track_id` | smallint | yes | FKs to reference tables | P | — |
| `bio_ar`, `bio_en` | text | yes | ≤ 1000 | P | — |
| `portfolio_url`, `github_url`, `linkedin_url`, `x_url` | text | yes | `^https://` | P | — |
| `is_directory_visible` | boolean | no | false | I | Opt-in (**OPEN Q-007**) |
| `legacy_claim_email` | text | yes | — | R | Email provided by leadership to send a claim link |
| `ended_at` | timestamptz | yes | — | I | When status left `active` |
| `created_at`, `updated_at` | — | — | standard | I | — |

Indexes: `user_id` unique, `(status, is_directory_visible)`, FK columns.

RLS: public reads only through `member_directory` view (active + visible + public columns); the member reads/updates own profile columns (column-restricted via a `update_my_member_profile()` function or column grants); `members.manage` reads all and changes status.

Membership expiry/renewal fields are intentionally absent until **OPEN Q-012** is answered (would add `expires_at` or a `membership_periods` table).
