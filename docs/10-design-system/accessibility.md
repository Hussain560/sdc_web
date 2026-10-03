# Accessibility

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Target: **WCAG 2.1 AA** in both directions and both themes (NFR-A11Y-001).

## 1. Current findings (CURRENT / PROBLEM)

| Area | Finding |
| ---- | ------- |
| Names | Theme toggle and dialog close buttons have no accessible name; decorative 404 icons use `alt="icon"` |
| Dialogs | No `role="dialog"`/`aria-modal`, no focus trap, no Escape handling, focus not restored |
| Focus | Inputs remove `outline` and rely on border color; buttons have no explicit focus style |
| Contrast | Light-theme accent text `#0B8F55` on `#F4FAF6` ≈ 3.9:1 (fails for normal text); others pass ([colors §3](./foundations/colors.md#3-contrast-notes)) |
| Language | Server always renders `lang="ar"`; English content announced with Arabic voice until hydration |
| Structure | Multiple pages lack a single `<h1>`/landmark structure; breadcrumbs are plain spans |
| Motion | No `prefers-reduced-motion` handling (shimmer, hover lifts) |
| Status by color | Committee page shows member/visitor and status mostly by color (text present, but small) |
| Total ARIA usage | 10 `aria-*` attributes across the app |

## 2. Requirements

| # | Requirement |
| - | ----------- |
| A-1 | Every interactive element is reachable and operable by keyboard in logical (direction-aware) order. |
| A-2 | Visible focus indicator: 2px `--color-focus-ring` outline with 2px offset on all focusable elements (`:focus-visible`). |
| A-3 | Icon-only controls have `aria-label` in the active language. |
| A-4 | Dialogs/drawers: `role="dialog"`, labelled by title, focus trap, Escape closes, focus returns to the trigger, background inert. |
| A-5 | Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI component boundaries) in both themes. |
| A-6 | Status conveyed by text (and color as reinforcement). |
| A-7 | Forms: programmatic labels, `aria-describedby` for hints/errors, error summary focused on submit failure. |
| A-8 | Correct `lang`/`dir` on `<html>`, and `lang` on embedded other-language fragments. |
| A-9 | Images: meaningful `alt` (localized) or `alt=""` when decorative. |
| A-10 | Respect `prefers-reduced-motion`. |
| A-11 | Touch targets ≥ 44×44 px on mobile. |
| A-12 | Live regions for async results (filter result counts, toasts). |

## 3. Verification

- Automated: axe checks in Playwright on key pages × locale × theme ([testing strategy](../09-quality/testing-strategy.md)).
- Manual: keyboard pass and screen-reader spot checks per release ([manual QA](../09-quality/manual-qa-checklist.md)).
- Design review: contrast check for any new token pair.
