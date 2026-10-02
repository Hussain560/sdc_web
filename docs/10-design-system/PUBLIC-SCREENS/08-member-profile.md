# Member Profile — `/members/[id]`

`app/members/[id]/page.tsx` + `details.css`. It reads one row from `members` by numeric id on the client.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ BANNER 164px                                          الرئيسية › الأعضاء › سعود محمد      │
│                                                                              سعود محمد   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [ عرض الكل ]                                                             أعضاء المجتمع   │
│                                  تعرّف على أعضاء مجتمعنا الذين يجمعهم الشغف بالتقنية…     │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  جامعة الملك سعود        الحالة الدراسية                     سعود محمد        (👤)    │ │
│  │  هندسة برمجيات           خريج                               علوم حاسب               │ │
│  │   (academic block, inline end)                    (علوم حاسب)(هندسة برمجيات)(…)       │ │
│  │                                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [SDC watermark]        مطور واجهات ومتحمس للمصادر المفتوحة وبناء الحلول الرقمية.  │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                              [in] [GitHub] [🔗]   (social icons, centered)            │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
The card stacks: identity → academic blocks → bio box → social icons.

---

## 2. Layout rules (CURRENT — keep)

- One wide detail card (radius 20). The identity block sits at the inline start, the academic info at the inline end.
- The bio box has the SDC pattern watermark at the inline end, with the text centered.
- Social icons (portfolio, X, LinkedIn, GitHub) **always render**; a missing link falls back to `#` (CURRENT).
- **TARGET:** render only the links that exist.

## 3. States

| State | CURRENT | TARGET |
| ----- | ------- | ------ |
| Loading | Blank until loaded | Card skeleton: circle + 2 lines + 3 pills; academic 2×2 lines; bio box 3 lines |
| Not found / hidden | Empty card | 404 (no "member exists but hidden" leak) |
| Own profile | — | *تعديل ملفي* outline capsule at the card's top inline end → `/account/member-profile` |

## 4. Data

| Item | CURRENT | TARGET |
| ---- | ------- | ------ |
| Member | `members` by id (all columns, anon) | `member_directory` by `public_id` (uuid or slug), opted-in only ([membership entities](../../05-database/entities/membership.md)) |
| URL | `/members/4` | `/members/<public_id>`; old ids redirect only while the member is visible |

## 5. Known issues

- Numeric ids are enumerable.
- Social icons with `href="#"` when the member has no link.
- The section header "أعضاء المجتمع" + *عرض الكل* repeats the list page's header.
