# Layout, Spacing, Shape and Elevation

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

## 1. Breakpoints (mobile-first, `min-width`)

| Name | Min width | Typical device | Tailwind |
| ---- | --------- | -------------- | -------- |
| base | 0 (designed at **360**) | Phones | — |
| `sm` | 640 px | Large phones, landscape | `sm:` |
| `md` | 768 px | Tablets portrait | `md:` |
| `lg` | 1024 px | Tablets landscape, small laptops | `lg:` |
| `xl` | 1280 px | Laptops | `xl:` |
| `2xl` | 1440 px | Desktops (designed at **1440**) | `2xl:` |

## 2. Grid

| Range | Columns | Gutter (page edge) | Column gap | Notes |
| ----- | ------- | ------------------ | ---------- | ----- |
| 360–639 | 4 | **16 px** | 16 px | One card per row; two for compact chips/stat tiles |
| 640–1023 | 8 | 24 px | 20 px | Two cards per row |
| 1024–1279 | 12 | 32 px | 24 px | Three cards per row; side panel appears at `lg` |
| ≥ 1280 | 12 | auto (centred container) | 24 px | Container capped; extra width becomes margin |

Containers (token → max inline size, padding = the gutter above):

| Token | Max width | Use |
| ----- | --------- | --- |
| `--container` | 1280 px | Default page content |
| `--container-wide` | 1440 px | Full-bleed bands' inner content, the floating header |
| `--container-narrow` | 768 px | Forms, join flow, certificate page |
| `--container-reading` | 720 px | Article body (≈ 68ch) |
| `--container-tight` | 440 px | The auth form column, small dialogs |

**Card grids** use `grid-template-columns: repeat(auto-fill, minmax(min(100%, 288px), 1fr))`. The `min(100%, …)` keeps a single card from overflowing at 360 px.

**Detail + side panel** (the event page): `grid-template-columns: minmax(0, 1fr) 360px` from `lg`, with a 48 px gap; stacked below `lg`.

### No sideways scrolling (hard rule)

- Content never causes horizontal page scroll at any width from 320 px up.
- No `100vw` widths and no negative-margin "full-bleed" tricks. A full-bleed band is a normal block child of `<main>` with its own inner container.
- Long tokens wrap: `overflow-wrap: anywhere` on user-generated text (names, e-mails, URLs, titles).
- Media is `max-inline-size: 100%`. Tables and code blocks scroll inside their own `overflow-x: auto` box, which is keyboard focusable (`tabindex="0"`, labelled).
- A horizontal strip (the partner marquee, chip rows) scrolls inside its container, never the page.
- CI: a Playwright check at 360 px asserts `document.documentElement.scrollWidth <= innerWidth` on every public route.

## 3. Spacing (4 px base)

| Token | Value | Typical use |
| ----- | ----- | ----------- |
| `--space-0-5` | 2 px | Hairline offsets |
| `--space-1` | 4 px | Icon-to-text in badges |
| `--space-2` | 8 px | Inline gaps, chip gaps |
| `--space-3` | 12 px | Field label gap, meta row gap |
| `--space-4` | 16 px | Phone gutter, compact card padding, form row gap |
| `--space-5` | 20 px | Grid gap (tablet), card body padding (phone) |
| `--space-6` | 24 px | Card padding, grid gap (desktop), gutter (tablet) |
| `--space-8` | 32 px | Section header → content, dialog padding (desktop), gutter (laptop) |
| `--space-10` | 40 px | Hero inner padding (phone) |
| `--space-12` | 48 px | Detail grid gap, band padding (tablet) |
| `--space-16` | 64 px | **Section rhythm (phone)**, band padding (desktop) |
| `--space-24` | 96 px | **Section rhythm (tablet)** |
| `--space-30` | 120 px | **Section rhythm (desktop)** |

**Section rhythm** = `--section-gap: clamp(4rem, 2.833rem + 5.185vw, 7.5rem)` (64 → 120 px). Sections are separated by this gap, never by borders. A tinted band (`--band`, `--radius-2xl`) adds `--space-16` of inner padding (desktop), `--space-10` (phone).

**Inside a section:** header (title + lede) → `--space-8` → content. Card padding `--space-6` (desktop) / `--space-5` (phone).

## 4. Radius

| Token | Value | Use |
| ----- | ----- | --- |
| `--radius-xs` | 6 px | Code chips, focus-ring radius on small items |
| `--radius-sm` | 10 px | Checkbox, tooltip, image inside a small card |
| `--radius-md` | 12 px | Inputs, selects, textarea, alerts |
| `--radius-lg` | 16 px | Accordion items, list cards, dropdown menus, inner image of a card |
| `--radius-xl` | 24 px | Cards, dialogs, the floating header, hero card |
| `--radius-2xl` | 32 px | Section bands, the auth brand panel |
| `--radius-full` | 9999 px | **All buttons**, pills, badges, chips, avatars, the segmented toggle |

**Nested radius rule:** inner radius = outer radius − padding (min `--radius-sm`). A card (`xl`, 24) with 8 px of padding around its image gives the image `lg` (16).

## 5. Elevation

v2 separates surfaces by **tone and hairlines**. Shadows are rare and green-tinted in dark.

| Token | Dark | Light | Use |
| ----- | ---- | ----- | --- |
| `--elev-0` | none | none | Cards at rest (border only) |
| `--elev-1` | `0 8px 24px` signal at 12% | `0 8px 24px` forest at 8% | Hovered interactive card, hovered directory card |
| `--elev-2` | `0 16px 40px` black at 50% | `0 16px 40px` forest at 12% | Dialogs, bottom sheets, menus, the floating header after scroll |
| `--elev-3` | `0 24px 64px` black at 60% | `0 24px 64px` forest at 16% | Toasts (they sit above dialogs) |

All shadow colours are `color-mix()` of a token (`--signal`, `--c-000000`, `--text`), never a literal.

## 6. Z-index

| Token | Value | Layer |
| ----- | ----- | ----- |
| `--z-sticky` | 10 | Sticky in-page elements (filter bar, mobile action bar) |
| `--z-header` | 100 | Floating header |
| `--z-overlay` | 1000 | Dialog, sheet and scrim (native `<dialog>` uses the top layer anyway) |
| `--z-toast` | 1100 | Toast region |
| `--z-skip` | 1200 | Skip link when focused |

## 7. Motif: "the crossing"

SDC's own graphic language comes from its mark: **two crossing capsules and two dots**. It replaces the reference sites' square motif.

| Element | Built from | Use |
| ------- | ---------- | --- |
| **Signal dots** | Two 8 px circles in `--signal`, 4 px apart | Before a section title (decorative, `aria-hidden`), on the active nav item |
| **Capsule pair** | Two `--radius-full` bars at ±35°, `--brand` and `--signal` | Behind the hero art, the auth brand panel, empty states, the 404 |
| **Dot grid** | 4 px dots on a 24 px pitch in `--border` | Quiet texture on bands and the brand panel (≤ 30% of the area) |

Rules: shapes, never pictures. A maximum of one motif per section. Never under text. Always `aria-hidden="true"`. Never redraw or recolour the SDC mark itself (use the files in `public/assets/`).
