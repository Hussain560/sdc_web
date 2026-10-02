# Module — Articles / Threads

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 3C |

## 1. Purpose
Publish reviewed, bilingual technical content authored by committees and members, enriching Arabic technical content (mission).

## 2. Current state
Six articles hardcoded (list ×2, detail ×1); labels alternate between "Thread" and "Article"; unknown ids fall back to article 1; unused JSON file.

## 3. Actors and permissions
`articles.create/edit/publish` in committee scope; authors edit own drafts (ownership). Approvers: Q-006.

## 4. Requirements
FR-ART-001…004.

## 5. Rules and lifecycle
[Article lifecycle](../../03-business-domain/article-lifecycle.md); BR-ART-001…005.

## 6. Data
`articles`, `article_authors`, `article_tags`, `tags` ([content entities](../../05-database/entities/content.md)); view `public_articles`; function `transition_article`.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/articles` | Everyone | List with tag/committee filters (label per Q-033) |
| `/articles/[slug]` | Everyone | Reading view: title, authors, date, reading time, tags, body, resource link; legacy `/articles/1…6` redirect |
| `/dashboard/articles` | Committee roles | Drafts, review queue, published, archived |
| `/dashboard/articles/new`, `/[id]/edit` | Committee roles | Bilingual Markdown editor with preview |

## 10. Edge cases
1. Slug edited after publish → old slug redirects.
2. Markdown containing raw HTML/script → stripped by renderer; validation warns.
3. Author account deleted → byline keeps display name snapshot.

## 11. Testing
Unit: reading-time, sanitizer. pgTAP: visibility by status, scope. E2E J7.

## 12. Open questions
Q-006, Q-033.
