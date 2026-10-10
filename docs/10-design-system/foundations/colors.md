# Colours

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

> v2 keeps the SDC identity and fixes what v1 couldn't: the surfaces are green-tinted, the muted text reads as part of the palette, and every status colour passes AA in **both** themes. The colours observed in the legacy CSS (v1) are in git history (`docs/10-design-system/foundations/colors.md` before 2026-10-10) and in [`primitives.css`](../../../src/styles/primitives.css).

## 1. Three layers

```text
primitives.css          tokens.css                    components
--c-00e676: #00e676 ──▶ --accent: var(--c-00e676) ──▶ bg-accent / var(--accent)
(raw hex, only here)    (role, switches per theme)    (never a hex, never a --c-*)
```

1. **Primitives** (`--c-<hex>`) live only in `src/styles/primitives.css`. A primitive's name is its value, so a primitive is never "re-tinted". A new colour is a new primitive.
2. **Semantic tokens** (`--canvas`, `--accent`…) live only in `src/styles/tokens.css`. Each one maps to one primitive per theme, and they are exposed to Tailwind under `@theme inline`.
3. **Components** use semantic tokens only. A component that needs a value no token has is a design-system change: add the token here first.

## 2. The palette at a glance

| | Dark (default) | Light |
| --- | --- | --- |
| Canvas | Deep night green `#050D09` | Mint `#F4FAF6` |
| Surfaces | Green-tinted `#0D1512` → `#131916` → `#1D2620` | White `#FFFFFF` → `#F3F9F6` |
| Text | White `#FFFFFF`, sage muted `#8FA79B` | Forest `#123B35`, moss muted `#4B635A` |
| Accent | Signal green `#00E676` (fill **and** text) | Palette green `#0A7A49` (fill and text); signal `#0B8F55` for large marks |
| Brand | Deep green `#067847` | Sage `#72C99A` |

## 3. Semantic tokens (v2)

| Token | Dark (default) | Light | Role |
| ----- | -------------- | ----- | ---- |
| `--canvas` | `#050D09` | `#F4FAF6` | Page background. |
| `--band` | `#061812` | `#E5F5EA` | Full-width tinted section bands (alternate sections, news band, partner strip). |
| `--surface` | `#0D1512` | `#FFFFFF` | Cards, header bar, footer, auth form side. |
| `--surface-raised` | `#131916` | `#F3F9F6` | Nested surfaces: closed accordion items, table header, hovered rows, chips at rest. |
| `--surface-overlay` | `#0D1512` | `#FFFFFF` | Dialogs, bottom sheets, menus, toasts. |
| `--field` | `#131916` | `#F3F9F6` | Input, select and textarea fill. |
| `--border` | `#1D2620` | `#CBE7D4` | Decorative hairlines between and around content (not a control boundary). |
| `--border-strong` | `#5C7A70` | `#6B8A80` | Control boundaries: inputs, checkboxes, outline buttons. Meets 3:1. |
| `--border-accent` | `#28674B` | `#A9D8BC` | Accent-framed surfaces: dialog edge, selected card, header hairline. |
| `--text` | `#FFFFFF` | `#123B35` | Body and headings. |
| `--text-muted` | `#8FA79B` | `#4B635A` | Ledes, meta rows, captions, helper text. |
| `--text-subtle` | `#7A9A90` | `#5C7A70` | Placeholders and disabled labels only (never information the reader needs). |
| `--text-on-accent` | `#08090C` | `#FFFFFF` | Label on the accent fill (primary button). |
| `--accent` | `#00E676` | `#0A7A49` | Primary button fill, active nav marker, selected state. |
| `--accent-hover` | `#00C853` | `#067847` | Hover and pressed accent fill. |
| `--accent-text` | `#00E676` | `#0A7A49` | Links, active nav text, accent icons on any surface. |
| `--accent-soft` | `#143426` | `#E5F5EA` | Tinted fill: selected chip, open accordion item, active tab, success alert. |
| `--on-accent-soft` | `#ABEFC6` | `#0D3329` | Text on accent-soft. |
| `--signal` | `#00E676` | `#0B8F55` | Decorative marks and large display numerals (24px+) only: motif dots, stat figures, glows. Never body text. |
| `--brand` | `#067847` | `#72C99A` | Deep brand fill: secondary filled button, brand panel. |
| `--on-brand` | `#FFFFFF` | `#0D3329` | Text on the brand fill. |
| `--success` | `#72C99A` | `#067847` | Success text and icons. |
| `--success-soft` | `#143426` | `#E5F5EA` | Success alert and pill fill. |
| `--warning` | `#FFAB00` | `#7A4F00` | Warning text and icons; "closes soon". |
| `--warning-soft` | `#2A1F05` | `#FFF4DC` | Warning alert and pill fill. |
| `--danger` | `#F87171` | `#B91C1C` | Error text, error borders, error icons. |
| `--danger-soft` | `#2A1013` | `#FDECEC` | Error alert and pill fill. |
| `--danger-fill` | `#EF4444` | `#B91C1C` | Destructive button fill. |
| `--on-danger-fill` | `#050D09` | `#FFFFFF` | Label on the destructive fill. |
| `--info` | `#60A5FA` | `#1D4ED8` | Informational text and icons. |
| `--info-soft` | `#0C1A2E` | `#E8F0FE` | Info alert and pill fill. |
| `--focus-ring` | `#00E676` | `#0A7A49` | 2px focus outline, 2px offset. |
| `--qr-ground` | `#FFFFFF` | `#FFFFFF` | White quiet zone behind QR codes in both themes (scanners need light around the code). Nowhere else. |
| `--scrim` | black at 75% | forest `#123B35` at 45% | Dialog and sheet backdrop. |

## 4. Rules

1. **One signal.** `--accent` marks the single most important action in a view, the active item and the focus ring. It never fills an area larger than a button or a stat tile, and it never colours a paragraph.
2. **Light theme accent text** is `#0A7A49` (5.1:1 on mint). The brighter `--signal` (`#0B8F55` in light) is for marks and numerals of 24 px or more only.
3. **Status = word + icon + colour.** A colour alone never carries meaning. Success and danger also differ in lightness (light theme: `#067847` vs `#B91C1C`), so they are told apart without hue.
4. **Soft fills carry their own text token**: `--accent-soft` → `--on-accent-soft`, `--warning-soft` → `--warning`, and so on. Never put `--text-muted` on a soft fill.
5. **Borders.** `--border` is decorative. Any boundary that identifies a control (input, checkbox, outline button) uses `--border-strong` (≥ 3:1, WCAG 1.4.11).
6. **Translucency** is only made from tokens with `color-mix(in srgb, var(--token) N%, transparent)`, never `rgba(<hex>)`. The header uses `color-mix(in srgb, var(--surface) 85%, transparent)` with a 12 px backdrop blur.
7. **Images over colour.** Text never sits directly on a photo. When an image carries a title, the title goes below it, or on a solid `--surface` scrim strip with a contrast that's guaranteed.
8. **Every new pair** gets a row in the [contrast table](../accessibility.md#2-contrast-every-token-pair-both-themes), checked in both themes before merge.

## 5. Changes from v1 that people will notice

| What | v1 | v2 | Why |
| ---- | -- | -- | --- |
| Dark surfaces | Neutral blue-black `#0D0E12`, `#16181D`, `#0D1117` | Green-tinted `#0D1512`, `#131916` | The brief asks for a green-tinted surface; the three dark greys merge into one ramp |
| Dark muted text | Neutral grey `#9CA3AF` | Sage `#8FA79B` (7.2:1) | Reads as SDC; same contrast class |
| Light muted text | `#52766C` (4.1:1 on mint tints) | `#4B635A` (≥ 5.7:1 on every light surface) | Fails AA on tinted bands |
| Light warning text | Amber `#FFAB00` (≈ 2:1) | `#7A4F00` (≥ 6.5:1) | Fixes the `a11y.css` override at the source |
| Danger | `#EF4444` in both themes | Text `#F87171` (dark) / `#B91C1C` (light); fills keep `#EF4444` in dark | `#EF4444` text fails on dark tinted fills |
| Info | None | `#60A5FA` / `#1D4ED8` | The brief needs an info role |
| Dark borders | `rgba(255,255,255,.15)` | Solid `#1D2620`, and `#5C7A70` for controls | Tokens without alpha; control borders now meet 3:1 |

The full token-to-primitive table, including what changed, is in [token-mapping.md](../token-mapping.md).
