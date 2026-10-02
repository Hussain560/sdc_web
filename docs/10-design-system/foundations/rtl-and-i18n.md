# RTL, LTR and Bilingual Design

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Current (CURRENT / PROBLEM)

- Server HTML is always `<html lang="ar" dir="rtl">`; `LanguageContext` switches `lang`/`dir` on `<html>` and `<body>` after hydration → English users see an RTL flash and layout jump.
- CSS uses physical properties (`margin-left`, `right: 8px`, `text-align: right`) in ~46 places and `direction: inherit` on many blocks; only one logical property is used.
- Some components hardcode Arabic (404 page, breadcrumb map, committee dashboard).
- Arrow icons are swapped manually per language in some places (`isEnglish ? <ArrowLeft/> : <ArrowRight/>`).

## 2. Rules (TARGET)

| # | Rule |
| - | ---- |
| RTL-1 | `lang` and `dir` are rendered by the server from the URL locale ([ADR-010](../../90-decisions/ADR-010-i18n-routing.md)). |
| RTL-2 | Use **logical properties** only: `margin-inline-start/end`, `padding-inline`, `inset-inline-start/end`, `border-inline-start`, `text-align: start/end`. Physical `left/right` only for things that must not mirror (e.g., a progress bar fill direction tied to time — rare). |
| RTL-3 | Flex/grid order follows document direction automatically — never reverse it per language. |
| RTL-4 | Direction-implying icons (arrows, chevrons, "back", breadcrumb separators, slider arrows) mirror in RTL via a `.icon-directional { transform: scaleX(-1) }` rule under `[dir='rtl']`. Non-directional icons (search, user, globe, calendar) never mirror. |
| RTL-5 | Mixed-direction text (English terms inside Arabic, emails, URLs, code) is wrapped with `<bdi>` or `dir="auto"` to avoid punctuation reordering. |
| RTL-6 | Inputs for email, URL and phone are `dir="ltr"` with `text-align: start` behaviour appropriate to content. |
| RTL-7 | Numbers: Western digits (0–9) in both languages unless **OPEN Q-042** decides otherwise; dates formatted with `Intl.DateTimeFormat('ar-SA' | 'en', { calendar: 'gregory', timeZone: 'Asia/Riyadh' })`. |
| RTL-8 | Text expansion: English is often longer than Arabic; components must tolerate +40% width without truncating actions. |
| RTL-9 | Language switcher shows the **target** language name in its own language ("English" / "العربية") — as today. |
| RTL-10 | Bilingual content fields fall back to Arabic when English is missing, marked with `lang="ar"` so screen readers switch voice. |

## 3. Checklist for every component

- [ ] Renders correctly with `dir="rtl"` and `dir="ltr"` without code branches
- [ ] Uses only logical spacing/positioning
- [ ] Directional icons mirror; others do not
- [ ] Long English and long Arabic strings do not break layout
- [ ] All strings from message catalogues
