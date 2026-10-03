# About — `/about`

`app/about/page.tsx` + `about.css`. Static content.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ BANNER 164px                                                      الرئيسية › عن المجتمع    │
│                                                     عن المجتمع السعودي للمطورين (SDC)      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                           ما هو المجتمع السعودي للمطورين  │
│        المجتمع السعودي هو مجتمع تقني غير ربحي يهدف إلى تمكين المطورين والمهتمين بالتقنية │
│        من اكتساب الخبرات العملية … (paragraph, max-width 1100px)                           │
│                                                                                            │
│  رسالتنا                                         رؤيتنا                                     │
│  ┌──────────────────────────────────┐            ┌──────────────────────────────────┐      │
│  │                          [icon]  │            │                          [icon]  │      │
│  │  تمكين المطورين السعوديين من…     │            │  أن نكون الحاضنة الأكبر…          │      │
│  └──────────────────────────────────┘            └──────────────────────────────────┘      │
│   677×143 each, gap 24px                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)
Banner → intro → vision card → mission card (stacked, full width).

---

## 2. Layout rules (CURRENT — keep)

- Banner pattern shared with the other content pages (`sdc-about-hero-banner`).
- Vision/mission titles sit **outside** the cards (`sdc-vm-outside-title`); the card has a 48px SDC icon at the inline start and the text below.
- The page has no call to action today.

## 3. States

Static page; no loading states. **TARGET:** optionally add a "قيادة المجتمع" strip reading `current_positions` (Phase 4) in the members-card style from [07-members](./07-members.md). Approval is required before adding it, because it changes the page.

## 4. Data

| Item | CURRENT | TARGET |
| ---- | ------- | ------ |
| Texts | Inline bilingual strings | next-intl messages (`about.*`); content owner: Design & Identity committee |
| Vision / mission | Inline | Same text as [vision-mission](../../00-product/vision-mission.md) — keep both in sync |

## 5. Known issues

- Duplicate "what is SDC" text also appears on every event page ([04-event-detail](./04-event-detail.md)).
