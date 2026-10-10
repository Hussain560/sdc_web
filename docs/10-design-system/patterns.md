# Patterns

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

Patterns combine [components](./components.md) into page sections. Wireframes are drawn **RTL** (Arabic reference): the inline-start is on the right. English mirrors them. Page-level specs (Part 2) build on these patterns. The dashboard patterns (v1 §6) are unchanged and live in [INTERNAL-SCREENS](./INTERNAL-SCREENS/README.md).

## 0. Public page skeleton

```text
┌ skip link ─────────────────────────────────────────────────────────────────┐
│ ╭─ floating header (SiteHeader) ───────────────────────────────────────────╮ │
│ ╰──────────────────────────────────────────────────────────────────────────╯ │
│ <main id="content">                                                         │
│   [announcement strip]?                                                     │
│   hero  OR  page header (breadcrumb · h1 · lede · actions)                  │
│   section … (--section-gap between sections)                                │
│   section in a band …                                                       │
│ </main>                                                                     │
│ ╭─ footer (SiteFooter) ────────────────────────────────────────────────────╮ │
└─────────────────────────────────────────────────────────────────────────────┘
```

One `h1` per page. Landmarks: `header`, `nav`, `main`, `footer`; `aside` for side panels. Auth pages use [§14](#14-auth-split-layout) instead (no header, no footer).

## 1. Hero

**Home hero (display):**

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                                         ┃ headline, display, ≤ 18ch,  2 lines │
│   [ SDC mark art ]                      ┃ lede, ≤ 60ch, 2 lines, muted         │
│   capsule-pair motif behind              ┃ [ primary ]   secondary link ←     │
│                                         ┃                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│   stat   │   stat   │   stat   │   stat      ← stats row (§8) inside the hero │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Text at the inline-start (right in Arabic), art at the inline-end. On phones the art comes **after** the actions, at 60% width.
- **One primary action.** The optional second action is a link, never a second filled button.
- The surface is the canvas with a soft radial glow (`color-mix(var(--signal) 14%)` → transparent) behind the art (dark), and the mint `--band` (light).
- The page header for inner pages: breadcrumb → `h1` → lede → optional actions or a filter bar, with `--space-16` top padding and no background image.

**Announcement strip** (optional, above the hero): a `--surface` capsule bar (`--radius-full`, 56 px) with a status pill, the event title (`body` 600, one line, ellipsis), a date chip, and an arrow link. The whole bar is one link.

## 2. Section header

```text
                         ●●  الفعاليات القادمة          ← h2 with the signal dots
           ورش ولقاءات مفتوحة، حضورياً وعن بُعد.         ← lede, muted, ≤ 60ch
[ عرض كل الفعاليات ← ]                                   ← secondary button at the opposite end (block-end aligned)
```

- Title + an optional one-line lede + an optional single action at the opposite end. On phones the action moves under the content as a full-width secondary button.
- **No eyebrow labels.** The signal dots (two 8 px dots) are the only decoration, `aria-hidden`.
- Alignment: start-aligned by default. Centred only for the page headers of list pages and the FAQ.

## 3. Card grid

`auto-fill, minmax(min(100%, 288px), 1fr)`, gap `--space-6` (desktop) / `--space-4` (phone). 1 / 2 / 3 columns (directory: 4 from `xl`). Rows align by sub-grid where supported (`grid-template-rows: subgrid`) so titles, meta and actions line up across cards. Loading = the same number of skeleton cards as the page size (max 6). Never a carousel for primary content.

## 4. Filterable list

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [🔍 ابحث عن فعالية…                        ] [النوع ▾] [الحضور ▾] [الفترة ▾]  │ ← one row, 48 px
│ active filters: (حضوري ✕) (ورشة ✕)   مسح الكل                    12 نتيجة    │ ← chips + live count
├──────────────────────────────────────────────────────────────────────────────┤
│ card grid (§3)                                                               │
│ [ عرض المزيد ]                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

- The search takes the widest share (≈ 50%); the selects share the rest equally. Below `md`: search full width + a "الفلاتر (2)" / "Filters (2)" button that opens a bottom sheet with the selects, the chips and an "Apply" primary.
- Filters live in the URL (`?type=workshop&mode=online`) and render on the server.
- The result count is in an `aria-live="polite"` region ("12 نتيجة" / "12 results").
- No results → the [empty state](./components.md#81-empty-state) "no results" with "Clear filters".
- The bar is sticky under the header on long lists (`--z-sticky`) only on ≥ `lg`.

## 5. Detail page with side facts

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ breadcrumb                                                                   │
│ status pill · h1 title (≤ 24ch)                                              │
│ date chip · place · seats                       ┌── side panel (360) ────────┐│
├────────────────────────────────────┐            │ cover image 16:9           ││
│ tabs / sections                    │            │ date & time                ││
│ about · agenda · speakers · FAQ    │            │ place / online             ││
│ …                                  │            │ seats left ▓▓▓▓░░          ││
│                                    │            │ [  primary action  ]       ││
│                                    │            │ certificate rule (1 line)  ││
│                                    │            │ share · add to calendar    ││
│                                    │            └── sticky (top: 96px) ──────┘│
└────────────────────────────────────┘                                          │
phone: side panel content moves under the hero; the primary action becomes a     │
sticky bottom bar:  [ 12 مقعداً متبقياً            ( سجّل الآن ) ]                │
```

- From `lg`: `minmax(0,1fr) 360px`, gap `--space-12`, and the panel is sticky.
- Below `lg`: the facts render as a 2-column fact list under the hero; the action bar is fixed to the block-end (64 px + safe area, `--surface` 95% + blur, top `--border`). Page content gets matching `padding-block-end` so nothing hides beneath it.
- The panel shows **one** primary action whose label follows the state.

## 6. Timeline (agenda)

A vertical list; each item is a row: a date chip (`block`) at the inline-start → a connector line in `--border` → a card with the time range, the title, the place, and the speaker avatars. **Multi-day events: one card per day** with its own date, time and place, labelled "اليوم 1" / "Day 1". The current item (live event) gets `--border-accent` and an "جارية الآن" / "Happening now" pill. On phones the date chip sits above the card.

## 7. Call-to-action band

```text
╭──────────────────────────────────────────────────────────────────────────────╮
│  h2: انضم إلى المجتمع                               [ قدّم طلب العضوية ]        │
│  one line, muted                                     capsule-pair motif (end)   │
╰──────────────────────────────────────────────────────────────────────────────╯
```

`--band` fill (dark) / `--accent-soft` (light), `--radius-2xl`, padding `--space-16`, one primary button. At most one CTA band per page, placed before the FAQ or the footer.

## 8. Stats row

3–4 `stat` cards in one row with `--border` dividers between them (no card borders): numeral (`stat`, `--signal`, `tabular-nums`) + label (`body-sm`, muted). They count up on reveal ([motion](./foundations/motion-icons-focus.md#12-catalogue)). On phones: a 2 × 2 grid. Figures come **only from real data** (a query or site settings); with no data the row isn't rendered (no "0+" and no invented numbers). A bento variant (About page): tiles in `--surface` / `--surface-raised` / `--accent-soft`, one tall tile.

## 9. Quote

A member or partner quote: a `--surface` card, `QuoteIcon` 32 in `--signal`, the quote (`lede`, ≤ 3 lines), then an avatar 40 + name + role. A quote is shown **only with the person's written consent and a real attribution**. With none, the section isn't rendered (placeholders appear only in design files, labelled "PLACEHOLDER").

## 10. Partner strip

A `--band` container (`--radius-2xl`) holding logos at a 40 px max height, monochrome (`filter: grayscale(1)` + 70% opacity, full colour on hover/focus), with a 48 px gap. With more logos than fit, it becomes a marquee with a pause button ([motion](./foundations/motion-icons-focus.md)); under reduced motion it wraps. Each logo is a link with `alt` = the partner name. The partner list comes from site settings, and the section is hidden when it's empty.

## 11. Directory

```text
page header (h1 · lede)
filter bar (§4): search · committee ▾ · track ▾
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ avatar  │ │ avatar  │ │ avatar  │ │ avatar  │    member cards (§3.1 member)
│ name    │ │ name    │ │ name    │ │ name    │    4 / 3 / 2 / 1 columns
│ track   │ │ track   │ │ track   │ │ track   │
│ (role)  │ │ (role)  │ │ (role)  │ │ (role)  │
│     (←) │ │     (←) │ │     (←) │ │     (←) │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

- **Privacy first:** only members with `listed = true` are queried (the filter runs in the database, not in the UI). Each field (photo, university, track, links) renders only when its consent flag is on. No e-mail or phone ever shows in the directory.
- Sort: leadership first (by role order from the database), then by name. Committee and track filters come from the database.
- States: loading (8 skeleton member cards), empty (no listed members yet), no results (clear filters).

## 12. Form layout

- One column, `--container-narrow` (or the dialog width). Fields are separated by `--space-6`; groups by a `h3` and `--space-10`.
- Arabic and English twin fields (admin only) sit side by side from `md`. Public forms have one language.
- Actions at the end of the form: primary + optional ghost. Full width on phones.
- Long forms (join) use the [stepper](./components.md#74-stepper) with one group per step and "Back / Next". Progress is kept when going back.
- The error summary at the top lists the errors as links; focus goes there on a failed submit.
- Anti-spam fields (honeypot) are visually hidden **and** `aria-hidden`, with `tabindex="-1"` and `autocomplete="off"`.

## 13. Confirmation and feedback

### 13.1 Choosing the channel

| Situation | Channel |
| --------- | ------- |
| The result of a flow the person started (registration, application, password reset) | **Result dialog** (or a result page for full-page flows) |
| A small in-place action (copy link, save preference) | Toast |
| A problem with what's on screen (validation, load failure) | Inline alert / field error |
| A persistent state of the object (you're registered, the event is cancelled) | Status pill + a panel on the page |

### 13.2 Minimum-duration submit (registration)

```text
press "سجّل" ──▶ t0: button → loading ("جارٍ التسجيل…"), form inert, Esc/close locked,
                    progress bar indeterminate, role=status "جارٍ تسجيلك…"
              ├─ server answers at t1
              └─▶ show result at max(t1, t0 + 1500 ms):
                    bar fills (200 ms) → dialog content swaps to the result dialog
                    focus → result title
```

- The 1.5 s floor applies to **every** outcome, including errors, so timing doesn't reveal which outcome happened and a script gains nothing by retrying fast.
- A double press does nothing (the existing `ref` lock). The button stays locked until the result is shown.
- Network failure after 15 s → the "try again" result.
- The progress and result live in the **same dialog** (no flash of closing and reopening). On phones it's the same bottom sheet.

### 13.3 Registration results

Each result is one icon, one title, one sentence, one next action. Status codes map from the registration RPC ([registration lifecycle](../03-business-domain/registration-lifecycle.md)).

| Result | Tone / icon | Title (AR / EN) | Sentence (AR / EN) | Action |
| ------ | ----------- | --------------- | ------------------ | ------ |
| Registered | success / `CircleCheck` | تم تسجيلك / You're registered | أرسلنا التفاصيل ورمز الدخول إلى بريدك. / We sent the details and your entry code to your e-mail. | أضف إلى التقويم / Add to calendar (+ "تم" / "Done") |
| Pending review (event requires approval) | info / `Clock` | استلمنا طلبك / We got your request | سنراسلك بالنتيجة بعد مراجعة الطلب. / We'll e-mail you once it's reviewed. | تم / Done |
| Waiting list | warning / `ListOrdered` | أنت في قائمة الانتظار / You're on the waiting list | سنراسلك إن توفّر مقعد. / We'll e-mail you if a seat opens. | تم / Done |
| Already registered | info / `Info` | أنت مسجّل مسبقاً / You're already registered | هذا البريد مسجّل في الفعالية. تفقد بريدك للتفاصيل. / This e-mail is already registered. Check your inbox for details. | تم / Done |
| Event full (no waitlist) | neutral / `Users` | اكتملت المقاعد / This event is full | تابع فعالياتنا القادمة. / See our upcoming events. | تصفح الفعاليات / Browse events |
| Registration closed | neutral / `CalendarX` | أُغلق التسجيل / Registration has closed | انتهت فترة التسجيل لهذه الفعالية. / Registration for this event has ended. | تصفح الفعاليات / Browse events |
| Too fast / too many attempts (throttled) | warning / `Timer` | محاولات كثيرة / Too many attempts | انتظر دقيقة ثم حاول مرة أخرى. / Please wait a minute and try again. | حسناً / OK (the retry is locked for the cooldown, with a visible countdown) |
| Validation refused by the server | danger / `CircleX` | تحقق من البيانات / Check your details | (returns to the form with field errors; not a result dialog) | — |
| Unknown error / network | danger / `CircleX` | تعذّر التسجيل / We couldn't register you | حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى. / Something went wrong. Please try again. | حاول مرة أخرى / Try again |

| Members-only event | info / `UserRound` | هذه الفعالية للأعضاء / This event is for members | التسجيل فيها متاح لأعضاء المجتمع. / Registration is open to community members. | قدّم طلب العضوية / Apply for membership |

**Mapping to the code** (`src/modules/registrations`): status `accepted` → Registered · `pending` → Pending review · `waitlisted` → Waiting list · `ALREADY_REGISTERED` → Already registered · `EVENT_FULL` / `CAPACITY_REACHED` → Event full · `REGISTRATION_CLOSED` → Registration closed · `RATE_LIMITED` / `TOO_FAST` → Too many attempts · `MEMBERS_ONLY` → Members-only · `VALIDATION_FAILED` / `CONSENT_REQUIRED` → back to the form · `INTERNAL` and anything else → Unknown error.

Honeypot or fill-time refusals show the **same** "too many attempts" result as throttling, so they don't tell a bot what triggered them.

## 14. Auth split layout

```text
desktop (≥ lg)                                       phone
┌────────────────────────┬──────────────────────┐    ┌──────────────────────┐
│  [logo]                │                      │    │ ▓ brand strip 96px ▓ │
│                        │  panel on --band     │    │   mark · motif       │
│  h1 مرحباً بعودتك        │  --brand / deep night │    ├──────────────────────┤
│  lede (1 line)         │  mark + capsule-pair │    │ h1                   │
│                        │  dot grid, r=2xl      │    │ fields               │
│  label / field         │  one line of copy    │    │ remember · forgot    │
│  label / password 👁   │                      │    │ [ دخول ]             │
│  ☐ تذكرني    نسيت؟      │                      │    │ لست عضواً؟ قدّم طلب   │
│  [      دخول       ]    │                      │    │ ← الرئيسية           │
│  لست عضواً بعد؟ قدّم طلب العضوية ←  │          │    └──────────────────────┘
│  ← العودة للرئيسية       │                      │
└────────────────────────┴──────────────────────┘
 form column 440 max (inline-start)   panel 45% (inline-end), inset 16px, r=2xl
```

- **No site header and no footer.** It's a route group with its own layout (`app/[locale]/(auth)/layout.tsx`).
- The form column is centred vertically, max 440 px. The logo links home. The language and theme switches sit at the top inline-end of the form column.
- The brand panel is decorative (`aria-hidden`, no essential text): the mark (`sdc-logo-mark.svg`), the capsule-pair motif, the dot grid, on `--band` in both themes (the mark's own greens need that ground to stay legible; `--brand` is too close to them). Owner-supplied photography may replace the motif later (media list).
- **No "create account".** The secondary path is "لست عضواً بعد؟ قدّم طلب العضوية" / "Not a member yet? Apply for membership" → `/join` (ADR-013), as a standalone link with an arrow.
- The same layout for sign in, forgot password, reset password and profile claim. Success states replace the form with a [result block](#13-confirmation-and-feedback) in the same column.
