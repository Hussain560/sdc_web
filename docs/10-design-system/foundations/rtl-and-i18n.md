# RTL, LTR and Bilingual Design

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

> **Arabic is the reference layout.** Every screen is designed in Arabic (RTL) first; English (LTR) is its mirror from the same markup and CSS. `lang` and `dir` come from the URL locale on the server ([ADR-010](../../90-decisions/ADR-010-i18n-routing.md)): `/…` is Arabic, `/en/…` is English.

## 1. Rules

| # | Rule |
| - | ---- |
| RTL-1 | The server renders `<html lang dir>` from the locale. No client-side direction switching. |
| RTL-2 | **Logical properties only**: `margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `text-align: start/end`, `float: inline-start`. Tailwind: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `rounded-s-*`, `border-s`. A lint rule (Stylelint `liberty/use-logical-spec` or a grep in CI) blocks `left/right` in new CSS. |
| RTL-3 | Flex and grid follow the document direction. Never reverse order per language. |
| RTL-4 | Directional icons mirror via `[dir='rtl'] .icon-dir { transform: scaleX(-1) }`; see the [icon list](./motion-icons-focus.md#2-iconography). |
| RTL-5 | **Keep their own direction:** numbers, dates and times, e-mails, URLs, phone numbers, code, certificate ids, handles (`@SDC_Saudi`), English product names. Wrap them in `<bdi>` (inline) or give the element `dir="ltr"` (blocks, inputs). |
| RTL-6 | Inputs for e-mail, URL, phone and certificate id are `dir="ltr"` with `text-align: start` in English and `text-align: end` in Arabic, so the caret sits where an Arabic reader expects the field to end. Their placeholders follow the same direction. |
| RTL-7 | Western digits (0–9) in both languages (Q-042 default). Dates use `Intl.DateTimeFormat(locale, { calendar: 'gregory', timeZone: 'Asia/Riyadh' })` → `14 أكتوبر 2026` / `14 October 2026`. Times use 12-hour with the localized period (`6:00 م` / `6:00 PM`). Ranges use an en dash with a thin space: `6:00 – 8:00 م`. |
| RTL-8 | **+30% rule.** Every component works when the English string is 30% longer than the Arabic one, and when an Arabic string is 30% longer than its English. Buttons grow; labels wrap; nothing truncates an action. Only card titles clamp (2 lines). |
| RTL-9 | The language switch shows the **target** language in its own name: "English" on Arabic pages, "العربية" on English pages, with `lang` and `hreflang` on the link. It keeps the current path (`/events/abc` ↔ `/en/events/abc`). |
| RTL-10 | A bilingual content field that is missing in English falls back to Arabic, marked `lang="ar" dir="rtl"` on that element. Screen readers switch voice, and the block reads right-to-left inside the LTR page. |
| RTL-11 | Charts, progress bars and step indicators run in the reading direction (fill from the inline-start). Time sliders and media scrubbers stay LTR (a universal convention). |
| RTL-12 | Punctuation: Arabic comma `،` and question mark `؟` in Arabic copy; never mix in Latin `,` `?`. |

## 2. Component checklist (every component, both directions)

- [ ] Renders correctly with `dir="rtl"` and `dir="ltr"` without code branches
- [ ] Only logical spacing, positioning, borders and radii
- [ ] Directional icons mirror; others don't
- [ ] Passes the +30% string test in both directions (Playwright fixture `longStrings`)
- [ ] All strings come from the message catalogues (`messages/ar.json`, `messages/en.json`); no hard-coded copy
- [ ] Numbers, dates, e-mails and URLs keep their own direction
- [ ] Keyboard order follows the visual order in both directions

## 3. Copy rules (both languages)

- Arabic: Modern Standard Arabic, warm and plain, gender-neutral constructions ([voice and tone](../../00-product/brand/voice-and-tone.md)).
- English: sentence case, plain verbs ("Register", "Apply", "Verify"), no all-caps, no decorative eyebrow labels above headings.
- One idea per sentence; say what happens next.
