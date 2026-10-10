# Typography

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

> v2 makes headlines much larger and more confident (the display size is about 4.5× body, after the reference sites) and keeps the two brand families. The internal dashboard keeps its Inter rule for English (2026-10-03 owner request). **Public pages use only IBM Plex Sans Arabic and Rubik.**

## 1. Families and pairing

| Token | Stack | Use |
| ----- | ----- | --- |
| `--font-sans` | `"Rubik", "IBM Plex Sans Arabic", system-ui, sans-serif` | Everything on public pages, in both languages |
| `--font-mono` | `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | Code in articles and certificate ids (system font, not a third brand family) |

**Pairing by glyph, not by language.** Rubik has no Arabic glyphs, so with Rubik first:

- Arabic letters fall through to **IBM Plex Sans Arabic**.
- Latin words, digits and Latin punctuation inside Arabic text render in **Rubik**, the brand Latin face. "React" or "2026" inside an Arabic sentence looks the same as on the English page.
- The `:lang(ar)` / `:lang(en)` swaps in `globals.css` go away. Weight, size and line-height rules below stay per language.

Both families load through `next/font/google` (self-hosted, `display: swap`): Plex Sans Arabic 400/500/600/700 (subset `arabic`), Rubik 400/500/600/700 (subset `latin`). **Plex Sans Arabic stops at 700**, so v2 headings are 700 in both scripts and the line keeps one weight when it mixes scripts.

## 2. Type scale

Fluid between a 360 px and a 1440 px viewport. `rem` on a 16 px root.

| Token | Size (360 → 1440) | `clamp()` | Line height AR / EN | Weight | Use |
| ----- | ----------------- | --------- | ------------------- | ------ | --- |
| `display` | 40 → 72 px | `clamp(2.5rem, 1.833rem + 2.963vw, 4.5rem)` | 1.25 / 1.1 | 700 | Home hero headline (one per site) |
| `h1` | 32 → 56 px | `clamp(2rem, 1.5rem + 2.222vw, 3.5rem)` | 1.3 / 1.15 | 700 | Page title, event title |
| `h2` | 28 → 44 px | `clamp(1.75rem, 1.417rem + 1.481vw, 2.75rem)` | 1.35 / 1.2 | 700 | Section title |
| `h3` | 20 → 24 px | `clamp(1.25rem, 1.167rem + 0.37vw, 1.5rem)` | 1.45 / 1.3 | 700 | Card group, sub-section, dialog title |
| `h4` | 18 px | `1.125rem` | 1.5 / 1.4 | 700 | Card title |
| `stat` | 36 → 56 px | `clamp(2.25rem, 1.833rem + 1.852vw, 3.5rem)` | 1.1 | 700, `tabular-nums` | Key figures |
| `lede` | 17 → 20 px | `clamp(1.0625rem, 1rem + 0.278vw, 1.25rem)` | 1.8 / 1.6 | 400 | Hero and section ledes |
| `body` | 16 px | `1rem` | 1.8 / 1.65 | 400 | Paragraphs |
| `body-sm` | 14 px | `0.875rem` | 1.7 / 1.55 | 400 | Meta rows, helper text, footer |
| `label` | 15 px | `0.9375rem` | 1.5 | 600 | Form labels, button labels (md), nav |
| `caption` | 13 px | `0.8125rem` | 1.5 | 500 | Timestamps, counts |
| `badge` | 12 px | `0.75rem` | 1.4 | 600 | Pills and badges (the smallest text on the site) |

**Ratios.** Display ÷ body = 4.5 at 1440 px (the reference sites run 3.5–4×). h2 ÷ body = 2.75. On phones the display falls to 2.5× so a 3-word Arabic headline fits on two lines at 360 px.

## 3. Measure

| Text | Max width |
| ---- | --------- |
| Lede | `60ch` |
| Body in pages | `70ch` |
| Article reading column | `68ch` (≈ 720 px at body size) |
| Display / h1 | `18ch` for the display, `24ch` for h1 (forces a deliberate 2-line break instead of one long line) |

## 4. Rules

1. **No letter-spacing** on any text (it breaks Arabic joining). Keep the `globals.css` guard, but without `!important` once the tokens are in.
2. **No uppercase, no italics.** English uses sentence case. Plex Sans Arabic has no italic; emphasis is weight 600.
3. **Western digits** in both languages (Q-042 default). Use `font-variant-numeric: tabular-nums` in stats, tables, dates and countdowns.
4. **Headings stay short.** Titles never truncate. Card titles clamp at 2 lines (`line-clamp: 2`) with the full title in the link's accessible name.
5. **One `display` per page**, only on the home page. Every other page starts at `h1`.
6. **Mixed scripts.** English terms inside Arabic are wrapped in `<bdi>` (or `dir="auto"` spans) so punctuation stays where it belongs.
7. **Line height is fixed per token** (never `normal`), so mixing families can't change the line box.
8. **Minimum** 12 px, and only for badges. Body text on phones is never smaller than 16 px.

## 5. Examples

| Token | Arabic | English |
| ----- | ------ | ------- |
| display | مجتمعٌ يبني المطوّر السعودي | A community that builds Saudi developers |
| h2 | الفعاليات القادمة | Upcoming events |
| lede | ورش عمل ولقاءات تقنية مفتوحة للجميع، حضورياً وعن بُعد. | Open workshops and tech meetups, in person and online. |
| label | البريد الإلكتروني | E-mail |
| caption | آخر تحديث 10 أكتوبر 2026 | Updated 10 October 2026 |

> The example strings are placeholders for illustration, not approved copy.
