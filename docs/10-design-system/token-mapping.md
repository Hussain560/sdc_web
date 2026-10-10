# Token Mapping (v2)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

This is the table engineers use to update `src/styles/primitives.css` and `src/styles/tokens.css` without guessing. Every semantic token maps to **one primitive per theme**. Nothing else in the codebase contains a hex value.

## 1. Primitives to add (`primitives.css`)

Same naming as the existing file (`--c-<hex>`, value = name). Existing primitives are untouched.

```css
  /* v2 status colours (ADR-014) */
  --c-0c1a2e: #0c1a2e;
  --c-1d4ed8: #1d4ed8;
  --c-2a1013: #2a1013;
  --c-2a1f05: #2a1f05;
  --c-60a5fa: #60a5fa;
  --c-7a4f00: #7a4f00;
  --c-b91c1c: #b91c1c;
  --c-e8f0fe: #e8f0fe;
  --c-f87171: #f87171;
  --c-fdecec: #fdecec;
  --c-fff4dc: #fff4dc;
```

## 2. Semantic tokens → primitives

"Was" is the current `tokens.css` value (or the value the legacy CSS used where no token existed yet). "Change" says what a reviewer will see.

| Semantic token | Dark → primitive | Light → primitive | Was (dark / light) | Change |
| --- | --- | --- | --- | --- |
| `--canvas` | `--c-050d09` | `--c-f4faf6` | `#050D09` / `#F4FAF6` | None |
| `--band` | `--c-061812` | `--c-e5f5ea` | new token | Added |
| `--surface` | `--c-0d1512` | `--c-ffffff` | `#0D0E12` / `#FFFFFF` | Value changed (dark) |
| `--surface-raised` | `--c-131916` | `--c-f3f9f6` | `#16181D` / `#F8FCF9` | Value changed (dark, light) |
| `--surface-overlay` | `--c-0d1512` | `--c-ffffff` | `#0D1117` / `#FFFFFF` | Value changed (dark) |
| `--field` | `--c-131916` | `--c-f3f9f6` | new token | Added |
| `--border` | `--c-1d2620` | `--c-cbe7d4` | `rgba(255,255,255,.15)` / `#CBE7D4` | Value changed (dark) |
| `--border-strong` | `--c-5c7a70` | `--c-6b8a80` | new token | Added |
| `--border-accent` | `--c-28674b` | `--c-a9d8bc` | `rgba(0,230,118,.3)` / `#A9D8BC` | Value changed (dark) |
| `--text` | `--c-ffffff` | `--c-123b35` | `#FFFFFF` / `#123B35` | None |
| `--text-muted` | `--c-8fa79b` | `--c-4b635a` | `#9CA3AF` / `#52766C` | Value changed (dark, light) |
| `--text-subtle` | `--c-7a9a90` | `--c-5c7a70` | new token | Added |
| `--text-on-accent` | `--c-08090c` | `--c-ffffff` | `#08090C` / `#FFFFFF` | None |
| `--accent` | `--c-00e676` | `--c-0a7a49` | `#00E676` / `#0A7A49` | None |
| `--accent-hover` | `--c-00c853` | `--c-067847` | `#00C853` / `#067847` | None |
| `--accent-text` | `--c-00e676` | `--c-0a7a49` | new token | Added |
| `--accent-soft` | `--c-143426` | `--c-e5f5ea` | `#ABEFC6` / `#CBE7D4` | Value changed (dark, light) |
| `--on-accent-soft` | `--c-abefc6` | `--c-0d3329` | new token | Added |
| `--signal` | `--c-00e676` | `--c-0b8f55` | new token | Added |
| `--brand` | `--c-067847` | `--c-72c99a` | `#067847` / `#72C99A` | None |
| `--on-brand` | `--c-ffffff` | `--c-0d3329` | new token | Added |
| `--success` | `--c-72c99a` | `--c-067847` | new token | Added |
| `--success-soft` | `--c-143426` | `--c-e5f5ea` | new token | Added |
| `--warning` | `--c-ffab00` | `--c-7a4f00` | `#FFAB00` / `#FFAB00` | Value changed (light) |
| `--warning-soft` | `--c-2a1f05` | `--c-fff4dc` | new token | Added |
| `--danger` | `--c-f87171` | `--c-b91c1c` | `#EF4444` / `#EF4444` | Value changed (dark, light) |
| `--danger-soft` | `--c-2a1013` | `--c-fdecec` | new token | Added |
| `--danger-fill` | `--c-ef4444` | `--c-b91c1c` | new token | Added |
| `--on-danger-fill` | `--c-050d09` | `--c-ffffff` | new token | Added |
| `--info` | `--c-60a5fa` | `--c-1d4ed8` | new token | Added |
| `--info-soft` | `--c-0c1a2e` | `--c-e8f0fe` | new token | Added |
| `--focus-ring` | `--c-00e676` | `--c-0a7a49` | new token | Added |
| `--qr-ground` | `--c-ffffff` | `--c-ffffff` | new token | Added |
| `--scrim` | `color-mix(in srgb, var(--c-000000) 75%, transparent)` | `color-mix(in srgb, var(--c-123b35) 45%, transparent)` | `rgba(0,0,0,.75)` (in Dialog) | Added as a token |

### Impact of the changed values

| Token | Where it shows today | Effect |
| ----- | ------------------- | ------ |
| `--surface` (dark) | Cards, header and dialogs in the dashboard (`bg-surface`) | Neutral → green-tinted. Dashboard baselines change slightly. |
| `--surface-raised` (both) | 112 uses of `bg-surface-raised` (dashboard rows, chips) | Dark: `#16181D` → `#131916`. Light: `#F8FCF9` → `#F3F9F6` (more visible). |
| `--surface-overlay` (dark) | 2 uses | `#0D1117` → `#0D1512` |
| `--text-muted` (both) | 361 uses of `text-muted` | Dark: grey → sage at the same contrast class. Light: darker, better contrast. |
| `--accent-soft` | 1 use (`var(--accent-soft)`) | Dark: mint `#ABEFC6` → deep green fill `#143426`. The one use must switch to `--on-accent-soft` if it was text. |
| `--warning` (light) | `text-warning` (10) | Amber → dark amber; the `a11y.css` override for `.text-warning` can be removed. `bg-warning` fills (5) should move to `--warning-soft`. |
| `--danger` (both) | `text-danger` (25), `border-danger` (7), `bg-danger` (3) | Text and borders get lighter in dark and darker in light. **`bg-danger` must move to `--danger-fill`** (the button). |
| `--border` (dark) | Every hairline | Translucent white → solid `#1D2620`: same look on the canvas, slightly darker on surfaces. |
| `--border-accent` (dark) | 41 uses of `border-line-accent` | Translucent → solid `#28674B` (≈ the same on the canvas). |

## 3. The new `tokens.css` (reference)

Paste-ready. The Tailwind `@theme inline` block gets one `--color-*` line per new token (e.g. `--color-band: var(--band);`, `--color-field: var(--field);`, `--color-line-strong: var(--border-strong);`, `--color-accent-text: var(--accent-text);`, `--color-signal: var(--signal);`, `--color-success: var(--success);`, `--color-info: var(--info);` and the `*-soft` and `on-*` tokens).

```css
:root {
  color-scheme: dark;
  --canvas: var(--c-050d09);
  --band: var(--c-061812);
  --surface: var(--c-0d1512);
  --surface-raised: var(--c-131916);
  --surface-overlay: var(--c-0d1512);
  --field: var(--c-131916);
  --border: var(--c-1d2620);
  --border-strong: var(--c-5c7a70);
  --border-accent: var(--c-28674b);
  --text: var(--c-ffffff);
  --text-muted: var(--c-8fa79b);
  --text-subtle: var(--c-7a9a90);
  --text-on-accent: var(--c-08090c);
  --accent: var(--c-00e676);
  --accent-hover: var(--c-00c853);
  --accent-text: var(--c-00e676);
  --accent-soft: var(--c-143426);
  --on-accent-soft: var(--c-abefc6);
  --signal: var(--c-00e676);
  --brand: var(--c-067847);
  --on-brand: var(--c-ffffff);
  --success: var(--c-72c99a);
  --success-soft: var(--c-143426);
  --warning: var(--c-ffab00);
  --warning-soft: var(--c-2a1f05);
  --danger: var(--c-f87171);
  --danger-soft: var(--c-2a1013);
  --danger-fill: var(--c-ef4444);
  --on-danger-fill: var(--c-050d09);
  --info: var(--c-60a5fa);
  --info-soft: var(--c-0c1a2e);
  --focus-ring: var(--c-00e676);
  --qr-ground: var(--c-ffffff);
  --scrim: color-mix(in srgb, var(--c-000000) 75%, transparent);
}

:root[data-theme='light'] {
  color-scheme: light;
  --canvas: var(--c-f4faf6);
  --band: var(--c-e5f5ea);
  --surface: var(--c-ffffff);
  --surface-raised: var(--c-f3f9f6);
  --surface-overlay: var(--c-ffffff);
  --field: var(--c-f3f9f6);
  --border: var(--c-cbe7d4);
  --border-strong: var(--c-6b8a80);
  --border-accent: var(--c-a9d8bc);
  --text: var(--c-123b35);
  --text-muted: var(--c-4b635a);
  --text-subtle: var(--c-5c7a70);
  --text-on-accent: var(--c-ffffff);
  --accent: var(--c-0a7a49);
  --accent-hover: var(--c-067847);
  --accent-text: var(--c-0a7a49);
  --accent-soft: var(--c-e5f5ea);
  --on-accent-soft: var(--c-0d3329);
  --signal: var(--c-0b8f55);
  --brand: var(--c-72c99a);
  --on-brand: var(--c-0d3329);
  --success: var(--c-067847);
  --success-soft: var(--c-e5f5ea);
  --warning: var(--c-7a4f00);
  --warning-soft: var(--c-fff4dc);
  --danger: var(--c-b91c1c);
  --danger-soft: var(--c-fdecec);
  --danger-fill: var(--c-b91c1c);
  --on-danger-fill: var(--c-ffffff);
  --info: var(--c-1d4ed8);
  --info-soft: var(--c-e8f0fe);
  --focus-ring: var(--c-0a7a49);
  --qr-ground: var(--c-ffffff);
  --scrim: color-mix(in srgb, var(--c-123b35) 45%, transparent);
}
```

## 4. Non-colour tokens

Add them to `tokens.css` under `:root` (theme-independent) and expose them in `@theme inline`:

| Group | Tokens | Spec |
| ----- | ------ | ---- |
| Type | `--font-sans`, `--font-mono`, `--text-display` … `--text-badge` (size, line-height pairs) | [typography](./foundations/typography.md#2-type-scale) |
| Space | `--space-0-5` … `--space-30`, `--section-gap` | [layout §3](./foundations/layout-and-shape.md#3-spacing-4-px-base) |
| Radius | `--shape-xs` … `--shape-2xl`, `--shape-full` (implemented name; see the note below) | [layout §4](./foundations/layout-and-shape.md#4-radius) |
| Elevation | `--elev-0` … `--elev-3` (per theme, via `color-mix`) | [layout §5](./foundations/layout-and-shape.md#5-elevation) |
| Layers | `--z-sticky` … `--z-skip` | [layout §6](./foundations/layout-and-shape.md#6-z-index) |
| Motion | `--duration-*`, `--ease-*` | [motion](./foundations/motion-icons-focus.md#11-tokens) |
| Containers | `--container`, `--container-wide`, `--container-narrow`, `--container-reading`, `--container-tight` | [layout §2](./foundations/layout-and-shape.md#2-grid) |

> **Implementation note (RDS-001, 2026-10-10).** `--radius-*` is Tailwind's own theme namespace. Redefining it would silently change every `rounded-*` utility in the dashboard (about 150 uses), which the impact table does not list. The v2 radius scale is therefore implemented as `--shape-xs … --shape-full` and exposed to Tailwind as `rounded-shape-xs … rounded-shape-2xl`. The values are unchanged. Everywhere the other docs say `--radius-xl`, read `--shape-xl`.
> `--ease-out/in/standard` do replace Tailwind's two built-in easing curves (one existing use, `ease-in`), and `--font-sans`/`--font-mono` arrive with RDS-002 (`next/font`).

## 5. Rules for changing a token

1. Change the **mapping** in `tokens.css`. Never change a primitive's value.
2. A colour that doesn't exist yet → add a primitive, then map it.
3. Run the contrast script. Every pair in [accessibility §2](./accessibility.md#2-contrast-every-token-pair-both-themes) must still pass in both themes.
4. Update this table and the contrast table in the same PR.
5. Visual baselines change → the owner approves the new baselines before they're committed.
