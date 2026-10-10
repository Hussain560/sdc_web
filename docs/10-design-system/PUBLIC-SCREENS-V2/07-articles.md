# 07 — Articles `/articles` and `/articles/[slug]`

**Purpose.** The list is a calm index to scan by topic. The reading page is all about a comfortable read in Arabic or English.

## 1. List `/articles` (RTL)

```text
 الرئيسية › المقالات
 المقالات                                                                    t-h1
 خلاصات وتجارب يكتبها أعضاء المجتمع.                                            t-lede
 [🔍 ابحث في المقالات…          ]  (الكل)(الويب)(الذكاء الاصطناعي)(البيانات)…    tag chips, scroll inside
 ┌──────────────────────────────┐  ┌────────────────────────┐ ┌────────────────────────┐
 │ featured (newest with cover) │  │ article card            │ │ article card           │
 │ cover 16:9 · tag · title     │  ├────────────────────────┤ ├────────────────────────┤
 │ excerpt · author · date      │  │ article card            │ │ article card           │
 └──────────────────────────────┘  └────────────────────────┘ └────────────────────────┘
 grid continues 3 / 2 / 1                                             ( عرض المزيد )
```

| State | UI |
| ----- | -- |
| Loading | 1 featured + 6 card skeletons |
| Empty | EmptyState "لم تُنشر مقالات بعد / No articles yet" |
| No results | EmptyState + "مسح البحث / Clear search" |
| Error | EmptyState error + retry |

Data: `public_articles` (+ `tags`), search `?q=`, tag `?tag=`.

## 2. Reading page `/articles/[slug]` (RTL)

```text
 الرئيسية › المقالات › ‹title›
                 ( الويب )                                         tag chip
                 ‹title›                                            t-h1, ≤ 24ch, reading column
                 (◯) ‹author› · 2 أكتوبر 2026 · 6 دقائق قراءة        author → profile if listed
                 [ cover 16:9, radius-xl ]                           M-11
                 ‹body: 68ch, t-body, line-height 1.8 AR / 1.65 EN›
                 h2 / h3 inside the body use t-h3 / t-h4
                 code blocks: --surface-raised, font-mono, dir=ltr, scroll inside
                 blockquote: inline-start border 3px --border-accent
                 ─────────────────────────────────────────
                 مشاركة: X · LinkedIn · نسخ الرابط
                 ●● مقالات ذات صلة   (same tag, 3 cards)
```

- Article language: when English is missing on `/en`, the Arabic body renders with `lang="ar" dir="rtl"` and a note "هذه المقالة متاحة بالعربية فقط / This article is available in Arabic only".
- External links in the body open in a new tab with the external icon; images need `alt` (enforced in the editor).

| State | UI |
| ----- | -- |
| Loading | Title, meta and 8 line skeletons |
| Not found / unpublished | 404 |
| Old numeric id | Redirect to the slug |

Data: `public_articles` by slug, `article_authors_named` for the byline.

## Media

`M-11` article covers (16:9, optional per article; the dot-grid fallback without one), inline images inside articles (authors supply them with `alt`).
