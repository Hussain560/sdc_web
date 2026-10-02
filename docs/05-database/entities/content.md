# Entities — Content (Articles / Threads)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) — **OPEN Q-006, Q-033** |

## 1. `articles`

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK | P | — |
| `legacy_id` | integer | yes | UNIQUE | P | Old id (1–6) |
| `slug` | text | no | UNIQUE | P | Stable after first publish |
| `committee_id` | uuid | yes | FK → `committees` RESTRICT | P | Owning committee |
| `status` | text | no | `'draft'`; CHECK in (`draft`,`in_review`,`changes_requested`,`published`,`archived`) | P* | Only `published` public |
| `title_ar` / `title_en` | text | no / yes | ≤ 200 | P | — |
| `excerpt_ar` / `excerpt_en` | text | yes | ≤ 500 | P | — |
| `body_ar` / `body_en` | text | no / yes | ≤ 50000, Markdown | P | — |
| `reading_minutes` | smallint | no | trigger: words / 200, min 1 | P | Replaces typed "3 min" |
| `cover_image_path` | text | yes | — | P | — |
| `resource_url` | text | yes | `^https://` | P | e.g., learning resources file |
| `resource_label_ar`, `resource_label_en` | text | yes | — | P | — |
| `submitted_by`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_note` | — | yes | — | I | — |
| `published_at` | timestamptz | yes | set once (trigger) | P | Displayed date |
| `archived_at` | timestamptz | yes | — | I | — |
| `created_by`, `created_at`, `updated_at` | — | — | standard | I | — |

Indexes: `slug` unique; partial `(published_at desc) where status = 'published'`; `(committee_id, status)`.

## 2. `article_authors`

| Column | Type | Null | Constraint | Description |
| ------ | ---- | ---- | ---------- | ----------- |
| `article_id` | uuid | no | FK → `articles` CASCADE | — |
| `position` | smallint | no | PK (`article_id`, `position`) | Byline order |
| `user_id` | uuid | yes | FK → `profiles` SET NULL | Registered author |
| `committee_id` | uuid | yes | FK → `committees` | Committee byline ("AI Committee") |
| `display_name_ar`, `display_name_en` | text | yes | — | Guest/legacy author names |
| | | | CHECK exactly one of (`user_id`, `committee_id`, `display_name_ar`) is set | — |

## 3. `article_tags`

| Column | Type | Constraint |
| ------ | ---- | ---------- |
| `article_id` | uuid | FK → `articles` CASCADE |
| `tag_id` | uuid | FK → `tags` RESTRICT |
| | | PK (`article_id`, `tag_id`) |

Supporting table `article_slug_redirects` (`old_slug` PK, `article_id` FK) keeps old URLs working when a slug changes ([articles module](../../11-modules/articles/README.md)).

RLS (all three): public reads rows of `published` articles; committee roles with `articles.edit` read/write drafts in scope; publish/archive through `transition_article()` with `articles.publish` in scope.
