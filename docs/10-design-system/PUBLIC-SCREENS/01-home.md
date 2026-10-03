# Home — `/`

`app/page.tsx` composes: `Header` → `HeroSection` → `ArticlesSection` (latest events + latest threads) → `CommunitySections` → `MembersSection` (members strip + partners slider) → `Footer`.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ HERO (460px)                                                                               │
│  ┌──────────────────────────────┐        المجتمع السعودي                                   │
│  │   [ 3D SDC mark + floating    │        للمطورين                      (h1, 2 lines)     │
│  │     code/data icons ]         │        نبني مجتمعاً سعودياً يقود المستقبل بالذكاء…       │
│  │        517×360                │                              [ رؤية المجتمع ]  → /about │
│  └──────────────────────────────┘                                                         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ EVENTS + THREADS (two columns of 584px, gap 32px)                                          │
│  [ عرض الكل ]          أحدث الثريدات          │                         أحدث الفعاليات       │
│  ┌──────────────────────────────────────┐    │ ┌──────────────────────────────────────┐   │
│  │ هندسة الأوامر (Prompt Engineering)  ‹ │    │ │ (مسابقات)(تقنية)(طلاب)     ┌────────┐ │   │
│  ├──────────────────────────────────────┤    │ │ لقاء تقني: بيئات العمل…    │ cover  │ │   │
│  │ تقنية Voice2Face                    ‹ │    │ │ [ قراءة المزيد ] [ تسجيل ] │(قريبًا) │ │   │
│  ├──────────────────────────────────────┤    │ │                           └────────┘ │   │
│  │ … 6 rows, 58px each                   │    │ └──────────────────────────────────────┘   │
│  └──────────────────────────────────────┘    │   … 3 event cards, 166px each              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ COMMUNITY SECTIONS                                                                         │
│                                أقسام المجتمع                                               │
│  [العلاقات العامة] [إدارة المنتجات] [البودكاست] [التسويق] [علم البيانات] [الذكاء الاصطناعي]  │
│   6 tiles 187×129: 32px icon over a 16px label                                             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ MEMBERS STRIP + PARTNERS (pattern background)                                              │
│                               اعضاء المجتمع                                                │
│                         (◯)(◯)(◯)(◯)(+)    ← overlapping 52px avatars                      │
│                               [ عرض الكل ]  → /members                                     │
│  قسم الشركاء                                                                               │
│  (‹)  [شعار المنصة] [شعار المنصة] [شعار المنصة] [شعار المنصة] …  (›)   ← 110×90 placeholders │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)

```
┌─────────────────────────────┐
│ HEADER (2 rows)              │
│     المجتمع السعودي          │
│       للمطورين               │
│ نبني مجتمعاً سعودياً…         │
│ [      رؤية المجتمع       ]  │ ← full-width capsule
│ [ hero art 343×239 ]         │
│ أحدث الفعاليات               │
│ ┌─────────────────────────┐ │
│ │ [ cover full width ]     │ │ ← card stacks: image on top
│ │ (قريبًا)                  │ │
│ │ tags · title · buttons   │ │  368px tall
│ └─────────────────────────┘ │  × 3
│ [عرض الكل]   أحدث الثريدات   │
│ rows 53px × 6                │
│ أقسام المجتمع: 2 columns × 3 │
│ members strip, partners      │
│ FOOTER                       │
└─────────────────────────────┘
```

---

## 2. Layout rules (CURRENT — keep)

- **Hero:** two halves on desktop: the art sits at the inline end, the text at the inline start. They stack on mobile with the text first.
- **Latest events:** the first 3 items of `allEvents` in **source order**, not by date.
  - Each horizontal card has a 190×125 cover at the inline start, with the status badge on the cover.
  - Tag pills use colour variants: `tag-competitions`, `tag-tech`, `tag-students`.
  - Buttons: *تسجيل* (primary) and *قراءة المزيد* (outline).
- **Latest threads:** 6 list rows, each a full-width link with a chevron.
- **Community sections:** 6 static tiles. They are not links today.
- **Members strip:** 4 avatar initials + a "+" bubble linking to `/members`.
- **Partners:** a horizontal slider of placeholder cards labelled "شعار المنصة", with arrow buttons (**OPEN Q-021**).

## 3. States

| Block | CURRENT | TARGET |
| ----- | ------- | ------ |
| Latest events | Always 3 hardcoded items | The 3 nearest **upcoming** published events (fallback: the latest ended); skeleton = 3 card skeletons at 166px; empty → hide the column and widen the threads column |
| Card *تسجيل* | Navigates to the event page | Same; the label follows the derived phase (*تسجيل* / *التسجيل مغلق* / *منتهي* disabled) |
| Latest threads | 6 hardcoded | Latest 6 published articles; skeleton rows |
| Members strip | Static initials | Up to 4 random directory members with avatars (opt-in only); hidden when there are none |
| Partners | Placeholders | Hidden until Q-021 is answered (placeholders must not ship to production) |

## 4. Data

| Block | CURRENT | TARGET |
| ----- | ------- | ------ |
| Events | `src/data/allEvents.ts` | `public_events` view ([events module](../../11-modules/events/README.md)) |
| Threads | Inline array in `ArticlesSection.tsx` | `public_articles` view |
| Community sections | Inline array | `committees` (active, public) — same 6 tiles if the committees match (**OPEN Q-004**) |
| Members strip | Inline | `member_directory` sample |

## 5. Known issues (do not fix ad hoc)

- The event status comes from a translated label string; the phase logic is in [event lifecycle §4](../../03-business-domain/event-lifecycle.md#4-timing-phase-derived-never-stored).
- `<img>` instead of `next/image` (24 lint warnings).
- "اعضاء المجتمع" is missing the hamza (أعضاء) — a copy fix goes in the i18n phase.
