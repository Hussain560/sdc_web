# Motion, Iconography and Focus

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

## 1. Motion

Motion explains a change. It is never decoration. It is quick, it settles softly, and it's switched off for people who ask for less.

### 1.1 Tokens

| Token | Value | Use |
| ----- | ----- | --- |
| `--duration-instant` | 100 ms | Colour and opacity on press |
| `--duration-fast` | 160 ms | Hover colour, border, icon nudge |
| `--duration-base` | 240 ms | Dialog and sheet enter, accordion open, tab indicator |
| `--duration-slow` | 400 ms | Section reveal, toast enter |
| `--duration-counter` | 1200 ms | Stat counters |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Things arriving (enter, expand, hover-in) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving (exit, collapse) — use at 75% of the enter duration |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0.2, 1)` | Position changes (tab indicator, carousel) |

### 1.2 Catalogue

| What moves | How | When |
| ---------- | --- | ---- |
| Section reveal | Opacity 0 → 1 and translate-block 12 px → 0, `--duration-slow`, `--ease-out`; children staggered by 60 ms (max 4) | Once, when 15% of the section enters the viewport (IntersectionObserver). Content is visible without JS. |
| Stat counter | 0 → value with `tabular-nums`, `--duration-counter`, ease-out | Once, on reveal. The final value is in the DOM from the start (screen readers and no-JS see it). |
| Card hover | Lift `translateY(-2px)` + `--elev-1` + border → `--border-accent`, `--duration-fast` | Pointer hover only (`@media (hover: hover)`) |
| Button press | Scale 0.98, `--duration-instant` | `:active` |
| Directional arrow in a link/button | Nudge 2 px toward the reading direction | Hover; mirrors in RTL |
| Dialog | Scrim fade + panel scale 0.96 → 1 and fade, `--duration-base` | Open/close |
| Bottom sheet | Slide up from the block-end, `--duration-base` | Open/close; drag handle |
| Accordion | Height via `grid-template-rows: 0fr → 1fr`, `--duration-base`; the icon rotates plus → minus | Toggle |
| Registration progress | Indeterminate bar along the dialog's top edge + the button spinner, then a determinate fill to 100% when the result arrives (≥ 1.5 s total) | See the [registration feedback pattern](../patterns.md#13-confirmation-and-feedback) |
| Skeleton shimmer | Existing `ui-skeleton` (1.4 s, follows reading direction) | Loading |
| Partner marquee | Continuous scroll at 30 px/s, **pauses on hover and focus**, with a visible pause button | Partner strip with more logos than fit |

### 1.3 Reduced motion (`prefers-reduced-motion: reduce`)

- Reveal, lift, scale and marquee are **off**: the content appears in place and the marquee becomes a static, wrapping grid.
- Counters show the final value immediately.
- Dialogs and sheets cross-fade only (opacity, ≤ 100 ms).
- The skeleton shimmer is off (static tint).
- The registration progress keeps its **minimum 1.5 s** (it's feedback and an anti-abuse delay, not decoration), shown as a static "Sending…" label and a stepped bar with no animation.

### 1.4 Rules

1. Animate only `transform`, `opacity`, `color`, `background-color`, `border-color`, `box-shadow`, `grid-template-rows`. Never `transition: all`.
2. Nothing moves on its own for more than 5 s without a pause control (WCAG 2.2.2).
3. Nothing flashes more than 3 times a second.
4. Motion respects direction: anything that "goes forward" moves toward the inline-end.

## 2. Iconography

| Rule | Value |
| ---- | ----- |
| Set | **lucide-react** only (already a dependency). No emoji as UI icons; no PNG icons (the legacy `alert-02.png`, `cancel-02.png`… are retired). |
| Stroke | **1.75** at every size (`strokeWidth={1.75}`; `absoluteStrokeWidth` off) |
| Sizes | 16 px (inline with `body-sm`, badges), **20 px** (default: buttons, inputs, meta rows), 24 px (nav, icon buttons, alerts), 32 px (feature tiles), 48 px (empty states, result dialogs) |
| Colour | `currentColor`. An icon inherits its text colour; the accent icons use `--accent-text`. |
| Optical alignment | Icons in text sit on the text's centre line (`vertical-align: -0.125em` or flex `align-items: center`). |
| Containers | Feature/benefit icons sit in a 48 px `--radius-lg` tile filled `--accent-soft` with the icon in `--on-accent-soft`. Result dialog icons sit in a 72 px circle filled with the tone's soft token. |
| Direction | **Mirror in RTL**: `ArrowRight/Left`, `ChevronRight/Left`, `ChevronsRight/Left`, `Undo/Redo`, `LogIn/LogOut`, `ExternalLink`, `Send`, list-indent icons. **Never mirror**: `Search`, `Calendar`, `Clock`, `MapPin`, `User`, `Check`, `X`, `Plus`, `Minus`, `Globe`, `Sun/Moon`, `Play`, media controls, brand logos. Use logical icon names in code (`<DirectionalIcon forward />`) rather than branching per language. |
| Meaning | An icon alone needs an `aria-label`. Next to text it is `aria-hidden="true"`. |

**Core icon vocabulary** (one icon per concept, everywhere): event `CalendarDays` · time `Clock` · place `MapPin` · online `Video` · seats `Users` · deadline `Hourglass` · certificate `Award` · check-in `QrCode` · member `User` · committee `UsersRound` · article `FileText` · track `Route` · university `GraduationCap` · external `ExternalLink` · success `CircleCheck` · warning `TriangleAlert` · danger `CircleX` · info `Info` · waitlist `ListOrdered` · throttled `Timer`.

## 3. Focus ring

| Property | Value |
| -------- | ----- |
| Selector | `:focus-visible` only (never remove `outline` without a replacement) |
| Style | `outline: 2px solid var(--focus-ring); outline-offset: 2px;` |
| Radius | Follows the element (`outline` follows `border-radius` in all supported browsers) |
| On accent fills | The 2 px offset puts the ring on the surface behind the button, so it stays visible on the green fill |
| Inside scrolling/clipped containers | Use `outline-offset: -2px` (inset) so the ring isn't clipped |
| Contrast | `--focus-ring` ≥ 3:1 on every surface in both themes ([table](../accessibility.md#2-contrast-every-token-pair-both-themes)) |
| Not obscured | Sticky header and mobile action bar use `scroll-padding-block` so a focused element is never hidden under them (WCAG 2.4.11) |
