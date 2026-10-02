# Entities — Organization

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) — canonical committee list pending **OPEN Q-004** |

## `committees`

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK | P | — |
| `slug` | text | no | UNIQUE, `^[a-z0-9-]+$` | P | URL key (`ai`, `cybersecurity`, `tech-development`, `projects`, `design-identity`) |
| `name_ar` | text | no | ≤ 100 | P | — |
| `name_en` | text | yes | ≤ 100 | P | — |
| `description_ar`, `description_en` | text | yes | ≤ 2000 | P | — |
| `status` | text | no | `'active'`; CHECK in (`active`,`inactive`) | P | Never deleted once referenced |
| `display_order` | smallint | no | 0 | P | — |
| `contact_email` | text | yes | — | P | Optional (**OPEN Q-004**) |
| `created_at`, `updated_at`, `created_by` | — | — | standard | I | — |

Indexes: PK, `slug` unique, `(status, display_order)`.

Relationships: referenced by `role_assignments.committee_id`, `events.committee_id` (NOT NULL), `articles.committee_id` (nullable), `membership_applications.preferred_committee_id`.

RLS: everyone reads `active` committees (and inactive ones referenced by public content, via views); insert/update requires `committees.manage` (global).

Seed (initial, **ASSUMPTION A-006**): AI, Cybersecurity, Technology & Development, Projects, Design & Identity.
