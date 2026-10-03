# Entities — Reference Data

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) — **OPEN Q-004** (tracks) |

Managed lists replace today's free-text bilingual columns so filters are consistent and translations exist once. All are publicly readable; writes require `reference_data.manage`.

| Table | Columns | Notes |
| ----- | ------- | ----- |
| `universities` | `id smallint identity PK`, `name_ar text not null unique`, `name_en text`, `is_active boolean default true`, `display_order smallint` | Seeded from distinct values in legacy `members.university` |
| `majors` | `id smallint identity PK`, `parent_id smallint null FK → majors(id)`, `name_ar`, `name_en`, `is_active` | Majors have `parent_id = null`; sub-majors (التخصص الدقيق) reference their major |
| `tracks` | `id smallint identity PK`, `name_ar`, `name_en`, `is_active`, `display_order` | Technical specialization (**ASSUMPTION A-006**) |
| `tags` | `id uuid PK`, `slug text unique`, `name_ar`, `name_en` | Article tags |

Event types and academic statuses are **CHECK-constrained text** (small, stable, code-relevant) with labels in i18n catalogues, not tables. If leadership needs to add event types without a release, `event_types` becomes a table (**OPEN Q-040**).

Applicants may type a university/major not in the list: the form offers "Other" with free text stored in `answers`, and a reviewer maps it to a list value (or adds one) during review. **Proposed.**
