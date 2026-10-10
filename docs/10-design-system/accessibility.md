# Accessibility

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

Target: **WCAG 2.2 AA** for every public page and component, in both directions and both themes. The v1 findings (missing dialog semantics, removed outlines, the light accent at 3.9:1…) are in git history; each one is resolved by a rule below.

## 1. Requirements

| # | Requirement | WCAG |
| - | ----------- | ---- |
| A-1 | Every interactive element is reachable and operable by keyboard; the tab order follows the **visual reading order** in both directions (no positive `tabindex`). | 2.1.1, 2.4.3 |
| A-2 | A visible focus ring on everything focusable: 2 px `--focus-ring`, 2 px offset, ≥ 3:1 on its surface ([spec](./foundations/motion-icons-focus.md#3-focus-ring)). Focus is never hidden under the sticky header or the mobile action bar (`scroll-padding`). | 2.4.7, 2.4.11, 1.4.11 |
| A-3 | Text contrast ≥ 4.5:1 (≥ 3:1 at 24 px+ or 19 px+ bold); control boundaries, icons and focus rings ≥ 3:1. **Every pair is listed in §2.** | 1.4.3, 1.4.11 |
| A-4 | Touch targets ≥ **44 × 44 px** (stricter than the 24 px AA minimum) with ≥ 8 px between targets. | 2.5.8 |
| A-5 | Dialogs and sheets: native `<dialog>`, labelled by the title, focus moves in on open and returns to the trigger on close, Esc closes (except while busy, with the reason stated), the background is inert. | 2.4.3, 4.1.2 |
| A-6 | Forms: a visible `<label>` for every field; hints and errors linked with `aria-describedby`; `aria-invalid`; an error summary focused on a failed submit; `autocomplete` tokens on personal fields; no information in placeholders only. | 1.3.1, 3.3.1–3.3.3, 1.3.5 |
| A-7 | Status is never colour alone: word + icon + colour ([status pill](./components.md#22-status-pill)). | 1.4.1 |
| A-8 | `lang` and `dir` on `<html>` from the server; `lang` on any fragment in the other language (fallback content, English terms in Arabic when longer than a word). | 3.1.1, 3.1.2 |
| A-9 | Images: a localized meaningful `alt`, or `alt=""` when decorative. Logos: `alt` = the organization name. The motif and the brand panel: `aria-hidden`. Event covers: `alt` from the required CMS field; if it's missing, `alt=""` plus the title in text next to it. | 1.1.1 |
| A-10 | `prefers-reduced-motion` honoured ([rules](./foundations/motion-icons-focus.md#13-reduced-motion-prefers-reduced-motion-reduce)); nothing auto-moves for more than 5 s without a pause. | 2.2.2, 2.3.3 |
| A-11 | Live regions for async results: filter counts (`polite`), registration progress (`status`), results (`status` / `alert`), toasts (`status`). | 4.1.3 |
| A-12 | Headings: one `h1` per page, no skipped levels; landmarks `header`, `nav` (labelled), `main`, `aside`, `footer`; a skip link first. | 1.3.1, 2.4.1 |
| A-13 | Reflow: usable at 320 CSS px and at 200% zoom with no horizontal page scroll; text spacing overrides don't clip. | 1.4.10, 1.4.12 |
| A-14 | Time limits: the 1.5 s registration floor and the throttle cooldown are announced ("انتظر 45 ثانية" / "Wait 45 seconds" countdown in a `timer` region, updated every 15 s). | 2.2.1 |
| A-15 | Authentication: sign-in allows paste and password managers; no cognitive tests (CAPTCHA puzzles) on public forms. | 3.3.8 |
| A-16 | Consistent help: the "contact us" link sits in the same place (footer) on every page. | 3.2.6 |
| A-17 | Redundant entry: the registration dialog pre-fills name and e-mail for signed-in members and remembers values when it returns to the form after an error. | 3.3.7 |

## 2. Contrast: every token pair, both themes

Computed with the WCAG 2 relative-luminance formula from the primitive values (script: `docs/10-design-system/tools/contrast.py`). "Pass (AAA)" = ≥ 7:1 in both themes.

| Foreground | Background | Dark | Light | Needs | Result |
| --- | --- | --- | --- | --- | --- |
| `--text` | `--canvas` | 19.66:1 | 11.66:1 | 4.5:1 | Pass (AAA) |
| `--text` | `--band` | 18.31:1 | 10.91:1 | 4.5:1 | Pass (AAA) |
| `--text` | `--surface` | 18.53:1 | 12.33:1 | 4.5:1 | Pass (AAA) |
| `--text` | `--surface-raised` | 17.82:1 | 11.57:1 | 4.5:1 | Pass (AAA) |
| `--text` | `--field` | 17.82:1 | 11.57:1 | 4.5:1 | Pass (AAA) |
| `--text` | `--accent-soft` | 13.56:1 | 10.91:1 | 4.5:1 | Pass (AAA) |
| `--text-muted` | `--canvas` | 7.65:1 | 6.14:1 | 4.5:1 | Pass |
| `--text-muted` | `--band` | 7.12:1 | 5.75:1 | 4.5:1 | Pass |
| `--text-muted` | `--surface` | 7.21:1 | 6.50:1 | 4.5:1 | Pass |
| `--text-muted` | `--surface-raised` | 6.93:1 | 6.09:1 | 4.5:1 | Pass |
| `--text-muted` | `--field` | 6.93:1 | 6.09:1 | 4.5:1 | Pass |
| `--accent-text` | `--canvas` | 11.78:1 | 5.10:1 | 4.5:1 | Pass |
| `--accent-text` | `--band` | 10.97:1 | 4.77:1 | 4.5:1 | Pass |
| `--accent-text` | `--surface` | 11.10:1 | 5.39:1 | 4.5:1 | Pass |
| `--accent-text` | `--surface-raised` | 10.68:1 | 5.06:1 | 4.5:1 | Pass |
| `--text-on-accent` | `--accent` | 11.93:1 | 5.39:1 | 4.5:1 | Pass |
| `--text-on-accent` | `--accent-hover` | 8.90:1 | 5.55:1 | 4.5:1 | Pass |
| `--on-accent-soft` | `--accent-soft` | 10.26:1 | 12.20:1 | 4.5:1 | Pass (AAA) |
| `--on-brand` | `--brand` | 5.55:1 | 6.92:1 | 4.5:1 | Pass |
| `--success` | `--surface` | 9.30:1 | 5.55:1 | 4.5:1 | Pass |
| `--success` | `--success-soft` | 6.80:1 | 4.91:1 | 4.5:1 | Pass |
| `--warning` | `--surface` | 9.78:1 | 7.13:1 | 4.5:1 | Pass (AAA) |
| `--warning` | `--canvas` | 10.37:1 | 6.74:1 | 4.5:1 | Pass |
| `--warning` | `--warning-soft` | 8.54:1 | 6.53:1 | 4.5:1 | Pass |
| `--danger` | `--surface` | 6.70:1 | 6.47:1 | 4.5:1 | Pass |
| `--danger` | `--canvas` | 7.11:1 | 6.12:1 | 4.5:1 | Pass |
| `--danger` | `--field` | 6.44:1 | 6.07:1 | 4.5:1 | Pass |
| `--danger` | `--danger-soft` | 6.42:1 | 5.66:1 | 4.5:1 | Pass |
| `--on-danger-fill` | `--danger-fill` | 5.23:1 | 6.47:1 | 4.5:1 | Pass |
| `--info` | `--surface` | 7.29:1 | 6.70:1 | 4.5:1 | Pass |
| `--info` | `--info-soft` | 6.87:1 | 5.85:1 | 4.5:1 | Pass |
| `--text-subtle` | `--field` | 5.82:1 | 4.40:1 | n/a (placeholder) | Pass |
| `--border-strong` | `--canvas` | 4.19:1 | 3.56:1 | 3.0:1 | Pass |
| `--border-strong` | `--surface` | 3.95:1 | 3.77:1 | 3.0:1 | Pass |
| `--border-strong` | `--field` | 3.80:1 | 3.53:1 | 3.0:1 | Pass |
| `--border-strong` | `--surface-overlay` | 3.95:1 | 3.77:1 | 3.0:1 | Pass |
| `--focus-ring` | `--canvas` | 11.78:1 | 5.10:1 | 3.0:1 | Pass |
| `--focus-ring` | `--band` | 10.97:1 | 4.77:1 | 3.0:1 | Pass |
| `--focus-ring` | `--surface` | 11.10:1 | 5.39:1 | 3.0:1 | Pass |
| `--focus-ring` | `--surface-raised` | 10.68:1 | 5.06:1 | 3.0:1 | Pass |
| `--signal` | `--canvas` | 11.78:1 | 3.91:1 | 3.0:1 | Pass |
| `--signal` | `--surface` | 11.10:1 | 4.14:1 | 3.0:1 | Pass |

Notes:

- `--text-subtle` is only for placeholders and disabled text (both exempt). It still reaches 4.4:1 in light and 5.8:1 in dark.
- `--signal` in light (`#0B8F55`) is for marks and numerals of 24 px or more only (3:1 large-text rule). It's never body text.
- Photos and posters are never a text background (colour rule 7), so no image-dependent pairs exist.

## 3. Keyboard order (public chrome)

1. Skip link → 2. Logo (home) → 3. Nav items in reading order → 4. Search → 5. Language → 6. Theme → 7. Primary CTA / account menu → 8. `main` content → 9. Footer.

On the event page from `lg` the side panel comes **after** the hero and **before** the tabs in the DOM, so the primary action is reached early. On phones the sticky action bar is the last item in `main` and is also reachable through a "Jump to registration" link in the hero.

## 4. Verification

| Check | How | When |
| ----- | --- | ---- |
| Automated | axe-core in Playwright on every public route × {ar, en} × {dark, light} | CI, every PR |
| Contrast | The contrast script on `tokens.css` fails CI when a listed pair drops below its threshold | CI, when `tokens.css` or `primitives.css` changes |
| Reflow | 320 px viewport: `scrollWidth <= innerWidth` | CI |
| Keyboard | A manual pass through the flagship flows (home → event → register; directory → profile; sign-in) | Per release |
| Screen readers | VoiceOver (iOS, Arabic) and NVDA (Windows, English) spot checks | Per release |
| Reduced motion | Playwright with `reducedMotion: 'reduce'` snapshot | CI |
