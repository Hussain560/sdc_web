# Threads (Articles) List — `/articles`

`app/articles/page.tsx` + `all-articles.css`. Users see "ثريدات" (threads); code and URLs say "articles" ([glossary](../../00-product/glossary.md)).

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ BANNER 164px                                                         الرئيسية › الثريدات  │
│                                                                    مساحة المجتمع | ثريدات │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  grid 4 × 326px, gap 24px (1377px content width)                                           │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │                  (📄) │ │                  (📄) │ │ …            │ │ …            │    │
│  │ هندسة الأوامر          │ │ تقنية Voice2Face       │ │              │ │              │    │
│  │ (Prompt Engineering)  │ │ بقلم: «three authors» │ │              │ │              │    │
│  │ بقلم: لجنة الذكاء…     │ │ 25 نوفمبر 2024 · 3 دقائق│ │              │ │              │    │
│  │ 15 أغسطس 2024 · 3 دقائق│ │ (ذكاء اصطناعي)(Python) │ │              │ │              │    │
│  │ (ذكاء اصطناعي)(هندسة…) │ │                       │ │              │ │              │    │
│  │ [   قراءة الثريد   ]  │ │ [   قراءة الثريد   ]  │ │              │ │              │    │
│  └───────────────────────┘ └───────────────────────┘ └──────────────┘ └──────────────┘    │
│   … 8 cards                                                                                │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
Single column, full-width cards.

---

## 2. Layout rules (CURRENT — keep)

- **Card:** a 42px icon circle (document icon) at the inline start. Then:
  - title (up to 2 lines)
  - author line "بقلم: …"
  - meta: date · reading time
  - tag pills
  - a full-width outline *قراءة الثريد* capsule, pinned to the bottom
- Cards in a row can differ in height. The button is not bottom-aligned across a row today; keep it as is.

## 3. States

| State | CURRENT | TARGET |
| ----- | ------- | ------ |
| Loading | Static | 8 card skeletons (circle + 3 lines + 2 pills + capsule) |
| Empty | — | "لا توجد ثريدات منشورة بعد" |
| Filtering | — | Optional tag filter pills above the grid (needs design sign-off; FR-PUB) |

## 4. Data

| Item | CURRENT | TARGET |
| ---- | ------- | ------ |
| Articles | Inline array (8) | `public_articles` view, `published_at desc` ([articles module](../../11-modules/articles/README.md)) |
| Authors | Free text | `article_authors` (users or display names) |
| Reading time | Hardcoded | Computed from the body length (≈ 200 words per minute) |

## 5. Known issues

- The list title says "ثريدات" but the breadcrumb on the detail page says "المقالات" — terminology is fixed in the i18n catalogue (**OPEN Q-033**).
