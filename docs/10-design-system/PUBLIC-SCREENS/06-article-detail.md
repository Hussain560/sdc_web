# Thread (Article) Detail — `/articles/[id]` → `/articles/[slug]`

`app/articles/[id]/page.tsx` + `article-details.css`. Content is hardcoded per id.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ BANNER 164px                 الرئيسية › المقالات › هندسة الأوامر (Prompt Engineering)     │
│                                                       هندسة الأوامر (Prompt Engineering)  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                       لجنة الذكاء الاصطناعي · 15 أغسطس 2024 · 3 دقائق · …   (meta row)     │
│                                      (ذكاء اصطناعي) (هندسة الأوامر) (…)   (tag row)       │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  هندسة الأوامر (Prompt Engineering) هي عملية تصميم وتحسين الأوامر …                    │ │
│  │  (body text, 1311px wide, line-height ~1.9)                                          │ │
│  │                                                                                      │ │
│  │                                                     [ مصادر تعلم هندسة الأوامر ↗ ]    │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
│   content card: full width (1377px), radius 20, padding 33                                 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules (CURRENT — keep)

- The meta row and tag row sit above the card, inline-start aligned.
- The body is one card. The source link is a capsule at the card's inline start (bottom).
- **TARGET line length:** the body is 1311px wide (≈ 160 Arabic characters per line). A max-width of ~760px inside the same card would improve readability **without changing the look of the card**. This needs design sign-off ([typography](../foundations/typography.md)).

## 3. States

| State | CURRENT | TARGET |
| ----- | ------- | ------ |
| Loading | Static | Meta + tag skeleton + a 12-line text skeleton inside the card |
| Unknown id | Fallback content | 404; old numeric ids redirect to slugs |
| Markdown | Plain paragraphs | Sanitized Markdown (headings, lists, code blocks in the card style) |

## 4. Data

`public_articles` by `slug` → `body_ar/en` (Markdown), authors, tags, `source_links[]` ([content entities](../../05-database/entities/content.md)).

## 5. Known issues

- The breadcrumb says "المقالات" while the list page says "ثريدات" (**Q-033**).
