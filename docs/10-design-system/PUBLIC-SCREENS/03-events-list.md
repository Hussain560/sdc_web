# Events List — `/events`

`app/events/page.tsx` + `all-events.css`. It lists all hardcoded events in a 3-column grid.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ BANNER 164px                                                         الرئيسية › الفعاليات │
│                                                                           فعاليات المجتمع │
│                      اكتشف فعاليات المجتمع القادمة، وشارك في ورش العمل، الهاكاثون…         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  container 1200px, grid 3 × 368px, gap 24px                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │              │
│  │ │ cover 326×180    │ │  │ │ cover            │ │  │ │ cover            │ │              │
│  │ │         (منتهي)  │ │  │ │         (منتهي)  │ │  │ │        (قريبًا)  │ │  ← badge,   │
│  │ └──────────────────┘ │  │ └──────────────────┘ │  │ └──────────────────┘ │    top       │
│  │ ورشة Google AI Studio │  │ …                    │  │ لقاء تقني: بيئات…    │    inline-   │
│  │ 📅 5/8/2026  💻 أونلاين │  │                      │  │ قريبًا سيعلن عنه  أونلاين │    start    │
│  │ [قراءة المزيد][تسجيل] │  │                      │  │ [قراءة المزيد][تسجيل] │              │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘              │
│   … 8 cards                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)
Single column. Cards are full width and the cover keeps its 16:9-ish crop.

---

## 2. Layout rules (CURRENT — keep)

- Card 368×384: 21px padding, cover radius 12. The title is up to 2 lines (26px line height).
- **Meta row:** location mode (أونلاين) and the date text. The free text "قريبًا سيعلن عنه" appears when there is no date.
- **Actions:** two equal capsules — *تسجيل* (primary) and *قراءة المزيد* (outline) — 40px tall.
- There are no filters or tabs today.

## 3. States

| State | CURRENT | TARGET (same look) |
| ----- | ------- | ------------------ |
| Loading | None (static import) | 6 card skeletons (cover block 180px + 2 text lines + 2 capsule blocks) using `.sdc-skel` |
| Empty | Not possible | "لا توجد فعاليات حاليًا — تابعنا على حساباتنا" + social links |
| Error | — | Muted message + *إعادة المحاولة* |
| Tabs | — | **TARGET (approved in FR-PUB):** two text tabs above the grid, *القادمة* / *السابقة*, in the nav-link style (accent underline for the active tab). This is the only visual addition, and it needs design sign-off |
| Badge | *قريبًا*, *منتهي* | All derived phases: قريبًا · التسجيل متاح · التسجيل مغلق · جارية · منتهي · ملغاة (same badge shape; tones from [00-data-model-reference §1.3](../INTERNAL-SCREENS/00-data-model-reference.md#13-phase-chip-derived-published-events-only--kfucs-stores-these-sdc-derives-them)) |
| Card *تسجيل* | Always shown, even on ended events | Shown only in the *registration open* phase; otherwise the button area shows the phase text in the outline style |

## 4. Data

| Item | CURRENT | TARGET |
| ---- | ------- | ------ |
| Events | `src/data/allEvents.ts` (8 entries) | `public_events` ordered by `start_date` (upcoming ascending, past descending) |
| Date text | Free string | Formatted from `start_date`/`end_date`/`schedule_type` (`Intl.DateTimeFormat`, Asia/Riyadh, Arabic or Latin digits per locale) |
| Location | Free string | `location_mode` label + `location_ar/en` |
| Cover | `/assets/*.png` | Storage `public-media/events/<id>/cover.webp` |

## 5. Known issues

- The status is read from translated labels, so the language and the status are coupled.
- Ended events still offer *تسجيل*; clicking opens the "event ended" dialog ([04-event-detail §3](./04-event-detail.md#3-states)).
