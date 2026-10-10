# 06 — About `/about`

**Purpose.** Who SDC is, why it exists, how it works, and who leads it. It's the page partners and universities read before they reply to an e-mail.

## Wireframe (RTL)

```text
 الرئيسية › من نحن
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ من نحن                                         t-h1              [ M-50 photo or the     │
 │ ‹PLACEHOLDER: who we are in 2 sentences›        t-lede              SDC mark art ]        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
 ●● رؤيتنا ورسالتنا
 ╭─────────────────────────╮ ╭─────────────────────────╮
 │ tile: الرؤية             │ │ tile: الرسالة            │    feature cards, text from
 │ ‹vision text›           │ │ ‹mission text›          │    docs/00-product/vision-mission.md
 ╰─────────────────────────╯ ╰─────────────────────────╯
 ●● قيمنا                     4–6 feature cards (principles.md) — owner confirms the public wording
 ●● أرقامنا (band)            stats bento: real figures only (same sources as home ③)
 ●● كيف نعمل                  ← suggested "how we work" (20-suggested-additions)
   committees → events → members, a 3-step diagram with links
 ●● القيادة                   leadership grid from current_positions (same cards as /members)
   ( تعرّف على كل الأعضاء ← )
 CTA band: انضم إلى المجتمع
```

## States

Leadership loading: 4 skeleton cards; none → section hidden. Figures with no source → hidden. Missing copy → the section is hidden (no lorem).

## Data and copy

`current_positions` (leadership). The vision, mission and values come from `docs/00-product/vision-mission.md` and `principles.md`, moved into the message catalogue. **Final public wording is the owner's** (Q-A1).

## Media

`M-50` an about-page photo of a real SDC gathering (16:9, owner supplied; the mark art until then), `M-21` leadership photos (consent).
