# Layout, Spacing, Shape, Elevation and Motion

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Containers

| Observed (CURRENT) | Count | Target token |
| ------------------ | ----- | ------------ |
| `max-width: 1440px` | 13 | `--container-wide: 1440px` (full-bleed sections' inner width) |
| `max-width: 1280px` | 2 (header) | `--container: 1280px` (default page container) |
| `max-width: 1200px` | 9 | merged into `--container` |
| 992 / 900 / 768 px | 17 | `--container-narrow: 768px` (forms, articles) |
| 640 / 600 / 480 / 440 px | 12 | `--container-tight: 440px` (auth card, dialogs) |

Gutters: 24 px desktop, 16 px mobile (`--gutter`).

Full-bleed banners currently use the `100vw` + negative margin trick (`margin-left/right: calc(-50vw + 50%)`), which causes horizontal overflow when a scrollbar is present — replace with full-width section wrappers.

## 2. Breakpoints

| Observed (CURRENT) | Target |
| ------------------ | ------ |
| 400, 480, 600, 640, 768, 900, 992, 1024 (all `max-width`) | Mobile-first `min-width` scale: `sm 640px` · `md 768px` · `lg 1024px` · `xl 1280px` |

## 3. Grid

| Pattern | Current | Target |
| ------- | ------- | ------ |
| Card grids | `display: grid` with ad-hoc columns per page | `repeat(auto-fill, minmax(280px, 1fr))` with `gap: var(--space-5)` |
| Leadership spotlight | 2-column grid (`.sdc-grid-2col`) | Same, collapses to 1 column below `md` |
| Detail + sidebar | Two-column content grid (event detail) | `minmax(0, 1fr) 340px` at `lg`, stacked below |

## 4. Spacing scale

4 px base. Observed paddings/gaps cluster at 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40 px.

| Token | Value | Typical use |
| ----- | ----- | ----------- |
| `--space-1` | 4px | Icon gaps |
| `--space-2` | 8px | Inline gaps, small paddings |
| `--space-3` | 12px | Card internal gaps, input padding-block |
| `--space-4` | 16px | Card padding (compact), mobile gutter |
| `--space-5` | 20px | Card padding, grid gaps |
| `--space-6` | 24px | Section inner padding, desktop gutter |
| `--space-8` | 32px | Auth card padding |
| `--space-10` | 40px | Section spacing (mobile) |
| `--space-16` | 64px | Section spacing (desktop) |

## 5. Radii

| Observed | Used for | Target token |
| -------- | -------- | ------------ |
| 6px | Status badges, category tags, small buttons | `--radius-sm: 6px` |
| 8px | Dialog buttons, skeletons, alerts | `--radius-sm` (merge) |
| 10–12px | Inputs, secondary card buttons | `--radius-md: 12px` |
| 16px | Dialogs | `--radius-lg: 16px` |
| 18–20px | Cards, auth card | `--radius-xl: 20px` |
| 50px / 999px / 9999px | Capsule buttons, pills | `--radius-full: 9999px` |
| 50% | Avatars | `--radius-full` |

**PROBLEM** — action buttons use three radii today (capsule 50 px in most places, 8 px in dialog confirm/cancel, 12 px for "professional info"). **TARGET** — all buttons are capsules (`--radius-full`); inputs use `--radius-md`.

## 6. Elevation

The system uses **borders + tinted glows**, not dark drop shadows.

| Token | Dark | Light | Use |
| ----- | ---- | ----- | --- |
| `--shadow-sm` | `0 4px 14px rgb(0 230 118 / 0.15)` | `2px 4px 12px rgb(22 167 101 / 0.10)` | Avatars, hovered chips |
| `--shadow-md` | `0 8px 25px rgb(0 230 118 / 0.15)` | `0 8px 25px rgb(22 167 101 / 0.12)` | Hovered cards |
| `--shadow-lg` | `0 10px 30px rgb(0 0 0 / 0.5)` | `0 10px 30px rgb(18 59 53 / 0.08)` | Auth card, dialogs |

## 7. Motion

| Observed | Target token |
| -------- | ------------ |
| `transition: all 0.2s ease` (20×), color 0.2s (10×) | `--duration-fast: 150ms`, `--duration: 200ms`, `--ease: cubic-bezier(0.2, 0, 0, 1)` |
| Card hover 0.25s (transform/box-shadow/border) | `--duration-slow: 250ms` |
| Skeleton shimmer 1.4s infinite | Keep |
| Dialog/backdrop blur 4px | Keep |

Rules: animate `transform`, `opacity`, `color`, `background-color`, `border-color`, `box-shadow` only (not `all`); respect `prefers-reduced-motion: reduce` (disable shimmer and hover lifts) — **not handled today**.

## 8. Z-index

| Layer | Value (current) | Token |
| ----- | --------------- | ----- |
| Sticky header | 1000 | `--z-header: 100` |
| Dialog/scrim | 1000 (same as header — conflict) | `--z-overlay: 1000` |
| Toasts | — | `--z-toast: 1100` |
