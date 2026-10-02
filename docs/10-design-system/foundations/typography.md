# Typography

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Typefaces

| Script | Typeface | Weights loaded today | Source today | Target loading |
| ------ | -------- | -------------------- | ------------ | -------------- |
| Arabic | **IBM Plex Sans Arabic** | 300, 400, 500, 600, 700 | Google Fonts `<link>` in `app/layout.js` | `next/font/google` (self-hosted, `display: swap`, subsets `arabic`) |
| Latin | **Rubik** | 300–900 (twice: `<link>` and `@import` in `globals.css`) | Google Fonts | `next/font/google` (subset `latin`), loaded once |
| Numerals / code | — | — | — | Rubik numerals; monospace system stack for code in articles |

**CURRENT** stack rules (`globals.css`): `:lang(ar)` → IBM Plex Sans Arabic first; `:lang(en)` → Rubik first; `* { letter-spacing: normal !important; word-spacing: normal !important; }` (protects Arabic joining — keep the intent, drop `!important` once tokens control letter-spacing).

**PROBLEM** — the 404 page uses `Inter`, which is never loaded (falls back to system fonts).

## 2. Observed scale (CURRENT)

| Role | Size | Weight | Where |
| ---- | ---- | ------ | ----- |
| 404 numeral | 10.5rem | 400 | `.sdc-404-number` |
| Hero title | 3.2rem | 800 | `.sdc-hero-title` (line-height 1.2) |
| Section title | 2rem | 800 | `.sdc-section-title` |
| Page banner title | 1.6rem | 800 | `.sdc-events-hero-title` and equivalents |
| Card title (large) | 1.3rem | 700 | detail cards |
| Card title | 1.05rem | 700 | `.sdc-card-name` |
| Body large | 1.15rem | 400 | hero description |
| Body | 0.95rem (most frequent size) | 400–500 | forms, lists |
| Navigation | 15px | 500 | `.sdc-nav a` |
| Small / meta | 0.85–0.88rem | 400–600 | meta rows, buttons |
| Caption / badges | 0.72–0.75rem | 600–800 | status badges, tags |

Weights in use: 400, 500, 600, **700** (36×), **800** (24×), 900 (1×).

## 3. Target type scale

Rem-based, 16 px root. Names are used as tokens (`--font-size-*`, `--line-height-*`).

| Token | Size | Line height | Weight | Use |
| ----- | ---- | ----------- | ------ | --- |
| `display` | 3.25rem (52px), clamp down to 2.25rem on mobile | 1.2 | 800 | Hero |
| `h1` | 2rem (32px) | 1.25 | 800 | Section and page titles |
| `h2` | 1.625rem (26px) | 1.3 | 800 | Page banner titles |
| `h3` | 1.25rem (20px) | 1.4 | 700 | Card/detail headings |
| `h4` | 1.0625rem (17px) | 1.4 | 700 | Card titles |
| `body-lg` | 1.125rem (18px) | 1.8 | 400 | Lead paragraphs, article body |
| `body` | 1rem (16px) | 1.7 | 400 | Default text (raised from 0.95rem for readability; confirm visually) |
| `body-sm` | 0.875rem (14px) | 1.6 | 400/500 | Meta, buttons, navigation |
| `caption` | 0.75rem (12px) | 1.4 | 600/700 | Badges, tags, helper text |

Rules:

- Arabic body text uses line-height ≥ 1.7 (Arabic ascenders/descenders and diacritics).
- No text smaller than 12 px.
- Headings use weight 700–800; avoid 900.
- Do not use letter-spacing on Arabic text; uppercase transforms only on Latin-only labels.
- Long-form content (articles) max line length ≈ 70 characters (`max-width: 70ch`).
