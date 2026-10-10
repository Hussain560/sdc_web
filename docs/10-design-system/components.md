# Components

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

> The v1 inventory of the legacy components (measured specs of the old CSS) is in git history before 2026-10-10. This file is the **target**: every component's anatomy, variants, states, sizes and bilingual examples. Implementation **extends the existing primitives in `src/components/ui`** ([§9](#9-implementation-map)); nothing is duplicated.

## 0. Conventions

### 0.1 The state model

Every interactive component defines these states. "—" in a component table means the state doesn't apply.

| State | Visual rule (default for all components) |
| ----- | ---------------------------------------- |
| default | As specified per component |
| hover | Pointer only (`@media (hover: hover)`). Fill one step stronger (`--accent` → `--accent-hover`; transparent → `--surface-raised`); `--duration-fast` |
| focus-visible | The [focus ring](./foundations/motion-icons-focus.md#3-focus-ring): 2 px `--focus-ring`, 2 px offset. Never removed. |
| active (pressed) | Scale 0.98 + the hover fill |
| disabled | Opacity 0.45, `cursor: not-allowed`, no hover. If the reason isn't obvious, use `aria-disabled="true"` + a visible reason (not a tooltip only) and keep it focusable. |
| loading | Label kept (for width), spinner at the inline-start, `aria-busy="true"`, not clickable, focus kept |
| error | `--danger` border/icon + the error message linked by `aria-describedby` |
| empty | The component's own empty content (e.g. a select with no options shows "No options") |
| success | `--success` icon/border + a short confirmation text |

### 0.2 Sizes

| Size | Control height | Label | Icon | Inline padding | Use |
| ---- | -------------- | ----- | ---- | -------------- | --- |
| `sm` | 36 px (touch area padded to 44) | `body-sm` 600 | 16 | 16 px | Dense rows, chips, inside cards |
| `md` (default) | **44 px** | `label` 600 | 20 | 20 px | Most buttons, all form controls |
| `lg` | 52 px | 16 px 600 | 20 | 28 px | Hero and dialog primary actions |

All targets are ≥ 44 × 44 px on touch devices (a 36 px `sm` control gets a 44 px hit area with a transparent padding pseudo-element).

### 0.3 Example strings

The examples are placeholders that show length and tone. They aren't approved copy; final strings go through the message catalogues.

---

## 1. Actions

### 1.1 Button

**Anatomy:** `[icon-start?] label [icon-end?]` inside a capsule (`--radius-full`). The label is one line; it wraps to two only in a full-width context.

| Variant | Fill | Label | Border | Hover | Use |
| ------- | ---- | ----- | ------ | ----- | --- |
| `primary` | `--accent` | `--text-on-accent` | none | `--accent-hover` | **One per view**: Register, Apply, Sign in |
| `secondary` | transparent | `--text` | 1.5 px `--border-strong` | fill `--surface-raised`, border `--accent` | View all, Read more, Add to calendar |
| `brand` | `--brand` | `--on-brand` | none | lighten 8% via `color-mix` with `--text` | A second filled action next to a primary (rare: "Join us" in the header when the primary is elsewhere) |
| `ghost` | transparent | `--text-muted` | none | fill `--surface-raised`, label `--text` | Tertiary: Cancel, Clear filters |
| `destructive` | `--danger-fill` | `--on-danger-fill` | none | darken 8% | Cancel registration, Delete |
| `link` | none | `--accent-text`, underlined on hover | none | underline | Inline action inside text |

| State | Rule |
| ----- | ---- |
| loading | Spinner (20 px, `currentColor`) replaces icon-start; the label changes to the progress verb ("جارٍ الإرسال…" / "Sending…") and the width stays the same (`min-inline-size` = the measured width) |
| disabled | 0.45 opacity; a disabled primary keeps its fill (so it reads as "the action, not yet") |
| success | Rare (in-place save): a check icon + "تم الحفظ" / "Saved" for 2 s, then back to default |

Sizes `sm` / `md` / `lg`; `fullWidth` on phones in forms and dialogs.

| | Arabic | English |
| --- | --- | --- |
| primary | سجّل الآن | Register now |
| secondary | عرض كل الفعاليات ← (arrow mirrors) | View all events → |
| destructive | إلغاء التسجيل | Cancel registration |

**Extends:** `ui/Button.tsx` (add the `brand`, `destructive` (rename of `danger`), `link` variants, `size`, `iconStart/iconEnd`, `fullWidth`; add `asChild` or a `LinkButton` wrapper for `@/i18n/navigation` links).

### 1.2 Icon button

Square-capsule hit area 44 × 44 (visual 40 px circle), icon 20 or 24. Variants `ghost` (default), `secondary` (1.5 px `--border-strong` circle), `primary` (accent fill). **`label` is required** (`aria-label`); a tooltip shows the same label on hover/focus after 500 ms.

Examples: close (X) "إغلاق" / "Close"; menu "القائمة" / "Menu"; round arrow on directory cards "عرض الملف" / "View profile".

**Extends:** `ui/IconAction.tsx` (make `label` required; add `variant`, `size`).

### 1.3 Link

| Variant | Style | Use |
| ------- | ----- | --- |
| inline | `--accent-text`, underline 1 px with 3 px offset, always underlined in body text | Links inside paragraphs |
| standalone | `--accent-text`, 600, no underline at rest, underline on hover, optional directional arrow at the inline-end | "عرض المزيد ←" / "See more →" |
| nav | `--text-muted`, 500 → `--text` on hover; active = `--text` + 2 signal dots under it + `aria-current="page"` | Header and footer navigation |
| external | Adds `ExternalLink` 16 px + visually hidden "(يفتح في نافذة جديدة)" / "(opens in a new tab)" | Map links, social links |

Visited links aren't styled differently. Every link goes through `Link` from `@/i18n/navigation`.

### 1.4 Segmented toggle

A pill track (`--surface-raised`, 4 px padding) with 2–4 segments; the selected segment is filled `--accent` with `--text-on-accent`, the others `--text-muted`. Implemented as a radio group (arrow keys move, `aria-checked`). Height 44. Use: "للأعضاء / للشركاء" ("For members / For partners") in why-join, "القادمة / السابقة" ("Upcoming / Past") on events.

**Extends:** `ui/Chips.tsx` (add `appearance="segmented"`).

---

## 2. Labels and status

### 2.1 Badge

A small non-interactive label. 24 px tall, `badge` type, `--radius-full`, 10 px inline padding, optional 14 px icon.

| Tone | Fill | Text |
| ---- | ---- | ---- |
| `neutral` | `--surface-raised` | `--text-muted` |
| `accent` | `--accent-soft` | `--on-accent-soft` |
| `success` | `--success-soft` | `--success` |
| `warning` | `--warning-soft` | `--warning` |
| `danger` | `--danger-soft` | `--danger` |
| `info` | `--info-soft` | `--info` |

A count badge (e.g. "12") uses `tabular-nums` and gets an accessible text ("12 عضواً" / "12 members").

**Extends:** `ui/Badge.tsx` (filled soft tones replace the outline-only tones; add `success`, `info`, `icon`).

### 2.2 Status pill

A Badge with a **required icon** and a fixed vocabulary, so status is never colour alone. Used on event cards, the event hero, registrations and the member profile.

| Status (event) | Tone | Icon | Arabic | English |
| -------------- | ---- | ---- | ------ | ------- |
| Registration open | success | `CircleCheck` | التسجيل مفتوح | Registration open |
| Closes soon (< 48 h or < 10% seats) | warning | `Hourglass` | يُغلق قريباً | Closes soon |
| Full, waiting list | warning | `ListOrdered` | مكتمل · قائمة انتظار | Full · waiting list |
| Registered | accent | `Check` | مسجّل | Registered |
| Running now | info | `Radio` | جارية الآن | Happening now |
| Finished | neutral | `Flag` | انتهت | Finished |
| Cancelled | danger | `CircleX` | أُلغيت | Cancelled |
| Upcoming, registration not open | neutral | `CalendarClock` | يفتح التسجيل قريباً | Registration opens soon |

### 2.3 Tag chip

A category or topic label; can be a filter toggle.

| Variant | Rest | Selected | Use |
| ------- | ---- | -------- | --- |
| static | `--surface-raised` fill, `--text-muted`, 28 px, `body-sm` | — | Topic tags on cards ("الذكاء الاصطناعي" / "AI") |
| filter (`button`, `aria-pressed`) | 1 px `--border-strong`, `--text`, 36 px (44 hit) | `--accent-soft` fill, `--on-accent-soft`, a check icon at the inline-start | Committee/track filters |
| removable | as selected + an `X` icon button "إزالة الفلتر: الذكاء الاصطناعي" | — | Active filters row |

The "+N" overflow chip lists the hidden tags in its accessible name.

### 2.4 Date and time chip

A compact, scannable date block with one primary fact.

| Variant | Anatomy | Use |
| ------- | ------- | --- |
| `block` | 56 × 64 px `--radius-lg` tile: day numeral (`h3`, `tabular-nums`) over the short month (`caption`) | Event cards, timeline |
| `inline` | `CalendarDays` + date · `Clock` + time range, `body-sm`, `--text-muted`, icons `--accent-text` | Card meta rows, side panel |
| `countdown` | "بعد 3 أيام" style relative text + absolute date in a `title` and in visually hidden text | Event hero when < 7 days |

Rendered in `<time datetime="2026-10-14T18:00+03:00">`. Arabic: `14 أكتوبر · 6:00 – 8:00 م`; English: `14 Oct · 6:00 – 8:00 PM`. The time zone (Riyadh) is shown only to viewers whose browser time zone differs ("بتوقيت الرياض" / "Riyadh time").

---

## 3. Content containers

### 3.1 Card

Base: `--surface`, 1 px `--border`, `--radius-xl`, padding `--space-6` (`--space-5` on phones), no resting shadow. An interactive card has **one** primary link (the title) whose `::after` covers the card. Nested actions sit above it with `position: relative`. No nested links.

| Variant | Anatomy | Hover |
| ------- | ------- | ----- |
| `event` | Image 16:9 inset 8 px (`--radius-lg`) → status pill + date chip row → title (`h4`, 2 lines) → meta row (place / online) → footer: seats left + secondary "التفاصيل" / "Details" | lift + `--elev-1` + `--border-accent` |
| `article` | Optional cover 16:9 → topic chip → title (`h4`) → 2-line excerpt (`body-sm`, muted) → author avatar 24 + name · date · reading time | same |
| `member` (directory) | Avatar 72 → name (`h4`) → track (`body-sm`, `--accent-text`) → role/committee badge → round arrow icon button at the block-end | same |
| `committee` | Icon tile 48 → name → one-line purpose → member count (caption) → arrow | same |
| `feature` (bento) | Icon tile 48 → title (`h4`) → one line. Alternates `--surface` and `--surface-raised` fills | none (not interactive) |
| `cta` (bento tall) | `--accent-soft` fill, the capsule-pair motif bottom-end, `h3` title, a primary button | button only |
| `stat` | `stat` numeral in `--signal` (`tabular-nums`) → label (`body-sm`, muted). Inside a stats row: dividers `--border` between tiles | none |
| `list` (horizontal) | Thumb 96 × 96 at the inline-end + title, 2-line excerpt, date + round arrow | lift |
| `featured` (poster) | Tall 3:4 image card, title on a solid `--surface` strip at the bottom (never on the image) | lift |

States: loading → [skeleton](#82-skeleton) with the same geometry; empty fields → the line is omitted (no "—" placeholders); image error → [image fallback](#33-image-with-fallback).

**Extends:** `ui/Card.tsx` (add `variant`, `interactive`, `media` slot). Domain cards (`EventCard`, `ArticleCard`, `MemberCard`) live in their modules and compose `Card`.

### 3.2 Avatar

Circle, sizes 24 / 32 / 40 / 56 / 72 / 120 px. Image → `object-fit: cover` with a 1 px `--border` ring. Fallback: initials (one letter for Arabic names, two for Latin) on `--accent-soft` with `--on-accent-soft`, 600; if no name, a `User` icon. Group: overlapping −8 px with a 2 px `--surface` ring, max 4 + "+N". **Privacy:** if the member hasn't made the photo public, show initials, never a blurred photo.

**Extends:** `ui/Avatar.tsx`.

### 3.3 Image with fallback

`<Image>` (next/image) inside a box with a fixed `aspect-ratio` (16:9 covers, 1:1 avatars, 3:4 posters) so the layout never shifts. Loading: the box shows the skeleton tint. Error or no source: the `--surface-raised` box with the dot-grid motif and a centred 32 px icon of the content type (`CalendarDays` for events, `FileText` for articles), `alt` kept. Decorative images get `alt=""`. Content images get a localized `alt` from the CMS field (required on upload).

**New:** `ui/Media.tsx`.

### 3.4 QR card

The **session check-in code shown at the venue** (ADR-013: guests check in by scanning it and typing the e-mail they registered with). Shown full screen by the organizer from the dashboard (`QrPanel`), and as the link target of the [check-in page](./PUBLIC-SCREENS-V2/02-event-page.md#6-check-in-page-eventsslugcheck-in).

**Anatomy:** a `--surface` card → the QR (min 280 × 280 on a projector view, on a **white quiet zone of 16 px in both themes**, because scanners need light around dark) → event title (`h3`) → "اليوم 1 · 14 أكتوبر" → instruction "امسح الرمز وأدخل بريدك المسجّل / Scan and enter the e-mail you registered with" → the short URL as text (`font-mono`, `dir="ltr"`) for people who can't scan → a refresh countdown when the token rotates.

States: open (live code, countdown) · rotating (cross-fade to the new code; reduced motion: swap) · session closed (the code is hidden; "أُغلق تسجيل الحضور لهذه الجلسة / Check-in for this session is closed") · loading (skeleton square).

The QR area is the only place a fixed white is allowed; it gets its own token, `--qr-ground` → `--c-ffffff` in both themes.

**Extends:** `modules/attendance/components/QrPanel.tsx`.

### 3.5 Certificate card

The public verification result and the member's certificate list item.

**Anatomy:** a frame with the `--border-accent` hairline + the SDC logo (theme variant) at the inline-start → "شهادة حضور" / "Certificate of attendance" (`caption`) → participant name (`h3`) → event title → date(s) and attendance ("حضر 3 من 4 جلسات (75%)" / "Attended 3 of 4 sessions (75%)") → certificate id (the uuid, `font-mono`, `dir="ltr"`) → status + actions (Download PDF, Copy link). Facts come from the frozen certificate snapshot; the e-mail is never shown.

| State | Tone | Text (AR / EN) |
| ----- | ---- | -------------- |
| valid | success | شهادة صحيحة صادرة من المجتمع السعودي للمطورين / Valid certificate issued by the Saudi Developer Community |
| not found | danger | لم نجد شهادة بهذا الرقم / No certificate matches this id |
| revoked (only if revocation is added, Q-CE1) | warning | أُلغيت هذه الشهادة / This certificate was revoked |
| loading | — | skeleton |

Print: `@media print` gives a white background, black text, no header, footer or buttons, and the id plus the verification URL printed under the card.

**New:** `modules/certificates/components/CertificateCard.tsx`.

---

## 4. Brand and chrome

### 4.1 Logo

| Variant | File (today) | On |
| ------- | ------------ | -- |
| Horizontal wordmark, light ink | `public/assets/Full whiteLogo 1.png` | Dark surfaces |
| Horizontal wordmark, full colour | `public/assets/navbar.png` | Light surfaces |
| Vertical lockup | `public/assets/Logos.png` | Footer (dark); light variant needed (media list) |
| Mark only | `public/assets/sdc-logo-mark.svg` | Favicon, auth phone strip, avatar fallback for SDC posts |

Rules: **clear space** = the height of one mark dot (≈ 25% of the mark height) on every side; minimum height 28 px (horizontal) / 24 px (mark). Never redraw, recolour, stretch, add effects, or put it on a photo without a solid `--surface` plate. The logo links home with `aria-label="المجتمع السعودي للمطورين — الرئيسية"` / "Saudi Developer Community — home". The files will be renamed to kebab-case in the implementation (`public/brand/…`) without changing pixels. SVG masters are Q-041.

### 4.2 Navigation bar

**Desktop (≥ `lg`)** — a floating bar inside `--container-wide`, 12 px from the top, height 64, `--radius-xl`, fill `--surface` at 85% + 12 px backdrop blur, 1 px `--border`; `--elev-2` after the page scrolls 8 px.

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ [logo]   ( الرئيسية · الفعاليات · المقالات · الأعضاء · من نحن )   🔍 EN ☀  [انضم إلينا] │
└───────────────────────────────────────────────────────────────────────────────┘
  inline-start                 nav pill (--surface-raised)            inline-end
```

- Nav items sit in a pill (`--surface-raised`, `--radius-full`, 4 px padding). The active item is filled `--surface` with `--text` and `aria-current="page"`.
- Inline-end: search (icon button), language switch, theme switch, then **one** primary: "انضم إلينا" / "Join us" → `/join`. Members who are signed in see their avatar menu instead of the CTA (Account, Dashboard if permitted, Sign out).
- The skip link "تخطَّ إلى المحتوى" / "Skip to content" comes first in the tab order.

**Mobile (< `lg`)** — a 56 px bar, not floating (full width, `--surface`, bottom `--border`): logo · search · menu. The menu button opens a **bottom sheet** (§6.3) with the nav list (48 px rows), language and theme switches, the Join CTA (full width, primary), and a quiet "دخول الأعضاء" / "Member sign-in" link.

States: link hover/focus/active as §1.3; the header hides on scroll down and shows on scroll up (off with reduced motion); the menu's open state uses `aria-expanded`.

**New:** `components/layout/SiteHeader` (replaces the legacy `Header`).

### 4.3 Footer

`--surface` band with `--radius-2xl` top corners, `--section-gap` above it.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [vertical logo]      المجتمع        الفعاليات        تواصل                  │
│ one-line tagline     من نحن          القادمة          X · LinkedIn          │
│                      اللجان          السابقة          Instagram (Q)         │
│                      انضم إلينا       التحقق من شهادة   البريد               │
├──────────────────────────────────────────────────────────────────────────┤
│ © 2026 المجتمع السعودي للمطورين · الخصوصية · دخول الأعضاء   [EN] [☀]        │
└──────────────────────────────────────────────────────────────────────────┘
```

Columns collapse to accordions below `md`. Social links come from configuration (one source). The year is computed. The "Member sign-in" link lives here (ADR-013).

**New:** `components/layout/SiteFooter`.

### 4.4 Language and theme switch

- **Language:** a text button (not a flag) "English" / "العربية" with `Globe` 20, `lang` and `hreflang` set; it navigates to the same path in the other locale and keeps the query string.
- **Theme:** an icon button (§1.2) `Sun` (in dark) / `Moon` (in light), `aria-pressed`. In the mobile sheet, both are rows with a [switch](#57-switch) for the theme.

### 4.5 Breadcrumb

`<nav aria-label="مسار التنقل" / "Breadcrumb">` + `<ol>`. Items `body-sm` `--text-muted` links; separator `ChevronLeft` in RTL / `ChevronRight` in LTR (one mirrored icon, `aria-hidden`); the current item `--text`, 600, `aria-current="page"`, not a link. On phones only the parent is shown ("← الفعاليات" / "← Events"). Max 4 levels; long titles truncate in the middle item only.

**Extends:** the unused `components/Breadcrumb`, moved to `ui/Breadcrumb.tsx`.

---

## 5. Forms

### 5.1 Form field (label, hint, error)

```text
البريد الإلكتروني  (مطلوب)              ← label (label token) + required as text
┌──────────────────────────────────┐
│ name@example.com              ✉  │    ← control (44–48 px)
└──────────────────────────────────┘
سنرسل التأكيد إلى هذا البريد.            ← hint (body-sm, muted)
⚠ أدخل بريداً إلكترونياً صحيحاً.         ← error (body-sm, --danger, icon) replaces nothing; hint stays
```

- The label sits above, `--space-2` gap. Required is shown as text "(مطلوب)" / "(required)"; optional fields say "(اختياري)" / "(optional)" only when most fields are required.
- `aria-describedby` = hint id + error id; `aria-invalid` when in error.
- Errors appear **on blur or submit**, never while typing the first time. They say what to do ("أدخل رقم جوال من 10 أرقام يبدأ بـ 05" / "Enter a 10-digit mobile number starting with 05").
- On submit with errors: focus moves to an error summary `Alert` at the top that links to each field.
- Success (rare, e.g. an available handle): `CircleCheck` + a short text in `--success`.

**Extends:** `ui/Field.tsx` (becomes the wrapper that also wraps Select/Textarea; add `required`, `optionalLabel`, `success`).

### 5.2 Input

48 px tall (44 in dense contexts), fill `--field`, 1 px `--border-strong`, `--radius-md`, 16 px inline padding, `body` text (16 px, which avoids iOS zoom). Placeholder `--text-subtle` (an example, never a label). Icons 20 px `--text-muted` at the inline-start (search) or end (status).

| State | Border | Other |
| ----- | ------ | ----- |
| default | `--border-strong` | |
| hover | `--text-muted` | |
| focus-visible | `--accent` 1 px + focus ring | |
| filled | default | |
| error | `--danger` 1.5 px | error icon at the inline-end |
| disabled | `--border` | fill `--surface-raised`, text `--text-subtle` |
| read-only | none | fill transparent, text `--text` |
| loading (async check) | default | spinner at the inline-end |

Types: `email`, `tel`, `url` → `dir="ltr"` (RTL-6) and the right `inputmode` and `autocomplete`. **Password** variant: a toggle icon button at the inline-end (`Eye` / `EyeOff`, label "إظهار كلمة المرور" / "Show password", `aria-pressed`). Search variant: `Search` icon + clear `X` when filled.

### 5.3 Textarea

Same as Input; min 4 rows, auto-grows to 12; a character counter (`caption`, `tabular-nums`) at the block-end when there's a limit ("120 / 500"), announced politely only near the limit. **Extends** `ui/Textarea.tsx`.

### 5.4 Select

The native `<select>` styled like Input with a `ChevronDown` at the inline-end (doesn't mirror). It's native for accessibility and mobile pickers; a custom listbox is used only for multi-select filters (then it's a [bottom sheet](#63-bottom-sheet) on phones with checkboxes). Empty: a disabled option "لا توجد خيارات" / "No options". **Extends** `ui/Select.tsx`.

### 5.5 Checkbox

20 × 20 box, `--radius-xs` (6 px), 1.5 px `--border-strong`; checked: `--accent` fill with a `--text-on-accent` check; indeterminate: a bar. The label sits at the inline-end of the box, and the whole row is clickable (44 px min height). Error on a group: the message under the group, `aria-describedby` on the fieldset. **New:** `ui/Checkbox.tsx`.

### 5.6 Radio

20 px circle, 1.5 px `--border-strong`; selected: a 2 px `--accent` ring + an 8 px `--accent` dot. Always in a `<fieldset>` with a `<legend>`. For 2–4 short options prefer the [segmented toggle](#14-segmented-toggle) or chips. **New:** `ui/Radio.tsx` (`Chips` stays for chip-style single choice).

### 5.7 Switch

Track 44 × 24 `--radius-full`: off `--surface-raised` + 1.5 px `--border-strong`; on `--accent`. Thumb 18 px: off `--text-muted`, on `--text-on-accent`. The thumb moves toward the inline-end when on (mirrors). `role="switch"`, `aria-checked`. Use it only for settings that apply immediately (theme, "show my university"). **Extends** `ui/Switch.tsx`.

### 5.8 Form layout

See [patterns §12](./patterns.md#12-form-layout).

---

## 6. Overlays and feedback

### 6.1 Dialog

Native `<dialog>` (focus trap, Esc, inert background). Panel: `--surface-overlay`, 1 px `--border-accent`, `--radius-xl`, `--elev-2`, padding `--space-8` (`--space-6` phone), width `min(32rem, 100vw − 32px)` (`sm`) / `40rem` (`md`). Scrim `--scrim` + 4 px blur.

**Anatomy:** header (title `h3` + close icon button at the inline-end) → body → footer (actions at the inline-end: secondary then primary; full-width stacked on phones, **primary on top**).

States: default · loading (the primary is loading, the body is `inert`, Esc and close are **disabled** while a request is in flight: "سيُغلق بعد اكتمال الإرسال" / "This closes once sending finishes") · error (an Alert at the top of the body) · success (swaps to a [result dialog](#62-result-dialog)).

Below `sm` a dialog with a form becomes a [bottom sheet](#63-bottom-sheet).

**Extends:** `ui/Dialog.tsx` (add `size`, `description`, `footer`, `busy` lock, close button, sheet mode).

### 6.2 Result dialog

The outcome of a flow (registration, application). It's styled after the KFUCS registration feedback: **one icon, one title, one sentence, one action.**

```text
┌──────────────────────────────────┐
│               ( ✓ )              │  72 px circle, tone-soft fill, 40 px icon in tone colour
│         تم تسجيلك بنجاح            │  h3, centred
│ أرسلنا تفاصيل الفعالية إلى بريدك.   │  body, muted, centred, ≤ 2 lines
│                                  │
│  [   أضف إلى التقويم   ]           │  primary, full width
│          تم                       │  ghost (only when a second action is truly useful)
└──────────────────────────────────┘
```

Focus goes to the title on open (it's `tabindex="-1"`), and the result is also announced through `role="status"` (success) or `role="alert"` (refusal). The full set of results is in [patterns §13](./patterns.md#13-confirmation-and-feedback).

**New:** `ui/ResultDialog.tsx` (composes Dialog).

### 6.3 Bottom sheet

Phones (< `md`): anchored to the block-end, `--radius-xl` top corners, a 4 × 40 px drag handle (decorative), max height 90dvh with internal scroll, safe-area padding. Same semantics as Dialog. Swipe down or the close button dismisses it (not while busy). Used for the mobile nav, filters, the registration form on phones, and the share menu.

**New:** sheet mode of `ui/Dialog.tsx` (`presentation="sheet"`).

### 6.4 Toast

For in-place, low-stakes confirmations only (copied link, saved preference). Bottom-centre on phones and bottom-inline-end on desktop, `--surface-overlay`, `--elev-3`, `--radius-lg`, an icon in the tone colour, one line + an optional action ("تراجع" / "Undo"). It stays 5 s, pauses on hover/focus, and has a close button. Polite live region (`role="status"`). Never used for errors that need action, and never for registration results. **Extends** `ui/Toast.tsx`.

### 6.5 Alert (inline message)

A tone-soft fill, a 20 px tone icon, a title (600) + body, `--radius-md`, padding `--space-4`. Tones: info, success, warning, danger. `role="alert"` for danger shown after an action, `role="status"` otherwise. Optional action link. **Extends** `ui/Alert.tsx`.

---

## 7. In-page navigation

### 7.1 Tabs

The underline style for content sections (event page: About · Agenda · Speakers · FAQ): `body` 600 labels, `--text-muted` → selected `--text` with a 3 px `--accent` bar on the block-end, animated with `--ease-standard`. The tab list scrolls horizontally inside its container on phones. Roving tabindex, `aria-selected`, arrow keys follow the reading direction. Use the segmented toggle (§1.4) when switching between two views of the same data. **Extends** `ui/Tabs.tsx`.

### 7.2 Accordion

Items are separate cards (8 px gap): closed = `--surface-raised`, `--radius-lg`, padding `--space-6`; the question `h4`/`body` 600 at the inline-start, and a 32 px circle button with `Plus` at the inline-end (`--surface` fill). Open: fill `--accent-soft`, the circle filled `--accent` with `Minus` in `--text-on-accent`, the answer `body` in `--text`. A `<button aria-expanded aria-controls>` inside an `h3`. Several may be open at once. **New:** `ui/Accordion.tsx`.

### 7.3 Pagination

`‹ 1 2 [3] 4 … 12 ›` with 44 px targets; the current page is filled `--accent-soft` with `aria-current="page"`. Prev/next mirror. On phones: "‹ الصفحة 3 من 12 ›" / "‹ Page 3 of 12 ›". For card feeds prefer a "عرض المزيد" / "Load more" secondary button that announces the new count. **Extends** `ui/Pagination.tsx`.

### 7.4 Stepper

Horizontal on ≥ `md`, vertical on phones. A step = a 32 px circle (number, or a check when done) + a label; the connector line fills in the reading direction. States: upcoming (`--border-strong` outline, muted), current (`--accent` fill, `aria-current="step"`), done (`--accent-soft` fill + check), error (`--danger` outline + `!`). Use it for the join application and the agenda timeline (days). **Extends** `ui/Stepper.tsx`.

---

## 8. Empty, loading and progress

### 8.1 Empty state

A centred block, max 420 px: the capsule-pair motif or a 48 px icon in a `--surface-raised` circle → title (`h3`) → one sentence (muted) → one action. Variants:

| Variant | Arabic | English | Action |
| ------- | ------ | ------- | ------ |
| no data | لا توجد فعاليات قادمة الآن | No upcoming events right now | تصفّح الفعاليات السابقة / Browse past events |
| no results | لا نتائج تطابق بحثك | Nothing matches your search | مسح الفلاتر / Clear filters |
| error | تعذّر تحميل القائمة | We couldn't load this list | إعادة المحاولة / Try again |
| not permitted | — (404, never reveal) | — | — |

**Extends** `ui/EmptyState.tsx` (add `variant`, `action`).

### 8.2 Skeleton

The existing `ui-skeleton` tint/shimmer; shapes match the final geometry exactly (card skeletons for card grids, text lines at 100% / 80% / 60%). The container has `aria-busy="true"` plus a visually hidden "جارٍ التحميل…" / "Loading…". Shown only after 300 ms (avoids flicker). **Extends** `ui/Skeleton.tsx` (add `shape` presets: `card-event`, `card-member`, `line`, `avatar`).

### 8.3 Progress (minimum-duration feedback)

A 4 px bar along the top edge of a dialog or card: indeterminate (a 30% segment sliding in the reading direction) while waiting, then it fills to 100% in 200 ms when the answer arrives. It is paired with the button's loading state and a `role="status"` text ("جارٍ تسجيلك…" / "Registering you…"). The minimum visible duration is set by the caller (1.5 s for registration). Under reduced motion it becomes a static bar and text. **New:** `ui/Progress.tsx`.

---

## 9. Implementation map

| Component | Status | File |
| --------- | ------ | ---- |
| Button (+ LinkButton) | Extend | `ui/Button.tsx` |
| Icon button | Extend | `ui/IconAction.tsx` |
| Link | New wrapper | `ui/TextLink.tsx` (over `@/i18n/navigation` `Link`) |
| Segmented toggle | Extend | `ui/Chips.tsx` |
| Badge, Status pill | Extend + new | `ui/Badge.tsx`, `ui/StatusPill.tsx` |
| Tag chip | New | `ui/TagChip.tsx` |
| Date/time chip | New | `ui/DateChip.tsx` (uses the shared date formatter) |
| Card | Extend | `ui/Card.tsx`; domain cards in modules |
| Avatar | Extend | `ui/Avatar.tsx` |
| Image with fallback | New | `ui/Media.tsx` |
| QR card | Extend | `modules/attendance/components/QrPanel.tsx` |
| Certificate card | New | `modules/certificates/components/CertificateCard.tsx` |
| Logo | New | `components/layout/Logo.tsx` |
| Nav bar, Footer | New (replace legacy) | `components/layout/SiteHeader`, `SiteFooter` |
| Language / theme switch | New | `components/layout/LocaleSwitch.tsx`, `ThemeSwitch.tsx` |
| Breadcrumb | Move + extend | `ui/Breadcrumb.tsx` |
| Field, Input, Password | Extend | `ui/Field.tsx` |
| Textarea, Select, Switch | Extend | `ui/Textarea.tsx`, `ui/Select.tsx`, `ui/Switch.tsx` |
| Checkbox, Radio | New | `ui/Checkbox.tsx`, `ui/Radio.tsx` |
| Dialog, Bottom sheet | Extend | `ui/Dialog.tsx` |
| Result dialog | New | `ui/ResultDialog.tsx` |
| Toast, Alert | Extend | `ui/Toast.tsx`, `ui/Alert.tsx` |
| Tabs, Pagination, Stepper | Extend | `ui/Tabs.tsx`, `ui/Pagination.tsx`, `ui/Stepper.tsx` |
| Accordion | New | `ui/Accordion.tsx` |
| Empty state, Skeleton | Extend | `ui/EmptyState.tsx`, `ui/Skeleton.tsx` |
| Progress | New | `ui/Progress.tsx` |
| Stat card | Extend | `ui/StatCard.tsx` (the `stat` card variant) |
