# Colors

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Observed palette (CURRENT)

Extracted from all CSS files (occurrence counts in parentheses). Roles are inferred from the properties and selectors where each value is used.

### 1.1 Dark theme (default)

| Value | Role in current UI | Examples |
| ----- | ------------------ | -------- |
| `#050D09` (36) | Page canvas, footer, page banners | `--background`, `.sdc-footer`, `.sdc-events-hero-banner` |
| `#08090C` (10) | Section background, text on accent | `.sdc-hero-section`, `.sdc-btn-confirm` text |
| `#0D0E12` (8) | Raised surface: header, cards, auth card | `.sdc-header`, `.sdc-event-card`, `.sdc-login-card` |
| `#0D1512 → #0A0F0C` | Member card gradient | `.sdc-member-card` |
| `#0D1117` | Dialog surface | `.sdc-modal-card` |
| `#16181D` | Form field background, committee rows | `.sdc-form-group input` |
| `#FFFFFF` (113) | Primary text, headings | everywhere |
| `#E5E7EB` | Navigation text | `.sdc-nav a`, `.sdc-icon-btn` |
| `#9CA3AF` (38) | Secondary text | meta, breadcrumbs |
| `#C9D3CE` | Tag text | `.sdc-tag-pill` |
| **`#00E676`** (63) | **Signal accent**: primary button, active links, highlights, focus, breadcrumb current item | `.sdc-login-submit-btn`, inline `color: #00E676` |
| `#00C853` | Accent hover | `.sdc-login-submit-btn:hover` |
| `#ABEFC6` (13) | Mint: card borders/hover, register hover | `.sdc-event-card:hover` |
| `#067847` | Deep brand green: register button, "available" badge text | `.sdc-btn-register`, `.sdc-badge-status.available` |
| `#56987B` | Muted green text (member role) | `.sdc-card-role` |
| `#7AAF98` | Muted green icons/links (event sidebar) | `.sdc-sb-icon-style` |
| `#FFAB00` | Warning / "coming soon" | `.sdc-badge-status.coming-soon` |
| `#EF4444` | Error text/borders | error alerts, reject button |
| `rgba(0,230,118,0.3)` | Accent border | auth card, dialog |
| `rgba(0,230,118,0.12–0.15)` | Accent tint background | active tag pill |
| `rgba(255,255,255,0.15–0.3)` | Neutral borders | inputs, outline buttons |
| `rgba(0,0,0,0.75)` + blur 4px | Dialog scrim | `.sdc-modal-overlay` |

### 1.2 Light theme

| Value | Role | Examples |
| ----- | ---- | -------- |
| `#F4FAF6` (29) | Page canvas | `--background` light, hero |
| `#F3F9F6` | Header surface | `.sdc-header` light |
| `#FFFFFF` | Card / dialog surface | `.sdc-login-card`, `.sdc-modal-card` light |
| `#F8FCF9` | Form field background | inputs light |
| **`#123B35`** (58) | Primary text ("forest") | `--foreground` light |
| `#52766C` (34) | Secondary text | meta, empty states |
| `#8AA39C` | Placeholder text | inputs |
| `#0D3329` | Text on light accent fills | buttons, active tags |
| `#0B8F55` (26) | Accent text/links/icons | links, active nav |
| `#16A765` | Accent hover / hover borders | hover states |
| `#168A5B` | Accent icon hover | social icons |
| `#72C99A` | Primary button fill, accent border | `.sdc-login-submit-btn` light, `.sdc-btn-register` light |
| `#5DB987` | Primary button hover fill | — |
| `#A9D8BC` | Strong border | dialog, outline buttons |
| `#CBE7D4` | Default border | cards, inputs |
| `#D8EDE0` | Header bottom border | — |
| `#E5F5EA`, `#EAF6EE` | Accent tint backgrounds | active tag pill, hovers |

### 1.3 Other media

| Value | Where |
| ----- | ----- |
| `#286A5E` | Email header band (not used on the web) — **OPEN Q-041** |
| Category tag text colors `#1F2937`, `#2563EB`, … | Home event card tags (hardcoded "Competitions / Technology / Students") |

## 2. Semantic tokens (TARGET)

Every component uses these names. Values reproduce the current look.

| Token | Dark | Light | Use |
| ----- | ---- | ----- | --- |
| `--color-bg` | `#050D09` | `#F4FAF6` | Page canvas |
| `--color-bg-section` | `#08090C` | `#F4FAF6` | Alternate full-width sections (hero) |
| `--color-surface` | `#0D0E12` | `#FFFFFF` | Cards, header, auth card |
| `--color-surface-overlay` | `#0D1117` | `#FFFFFF` | Dialogs, drawers, popovers |
| `--color-surface-field` | `#16181D` | `#F8FCF9` | Inputs, selects |
| `--color-text` | `#FFFFFF` | `#123B35` | Primary text |
| `--color-text-secondary` | `#9CA3AF` | `#52766C` | Meta, captions |
| `--color-text-nav` | `#E5E7EB` | `#123B35` | Navigation |
| `--color-text-placeholder` | `#6B7280` | `#8AA39C` | Placeholders |
| `--color-border` | `rgba(255,255,255,0.15)` | `#CBE7D4` | Default borders |
| `--color-border-strong` | `rgba(255,255,255,0.30)` | `#A9D8BC` | Outline buttons, dialogs |
| `--color-border-accent` | `rgba(0,230,118,0.30)` | `#A9D8BC` | Accent-framed surfaces |
| `--color-accent` | `#00E676` | `#0B8F55` | Accent text, active nav, icons, focus ring |
| `--color-accent-hover` | `#00C853` | `#16A765` | Hover of accent elements |
| `--color-accent-fill` | `#00E676` | `#72C99A` | Primary button background |
| `--color-accent-fill-hover` | `#00C853` | `#5DB987` | Primary button hover |
| `--color-on-accent-fill` | `#050D09` | `#0D3329` | Text on primary button |
| `--color-accent-soft` | `rgba(0,230,118,0.12)` | `#E5F5EA` | Selected chip, tinted backgrounds |
| `--color-brand-deep` | `#067847` | `#72C99A` | Secondary filled action (register) |
| `--color-mint` | `#ABEFC6` | `#A9D8BC` | Card borders and hover glow |
| `--color-success` | `#00E676` | `#0B8F55` | Success text/border |
| `--color-success-soft` | `rgba(0,230,118,0.10)` | `#E5F5EA` | Success alert background |
| `--color-warning` | `#FFAB00` | `#B26A00`* | Warning text/border |
| `--color-warning-soft` | `rgba(255,171,0,0.20)` | `#FFF4DC`* | Warning badge background |
| `--color-danger` | `#EF4444` | `#C62828`* | Errors, destructive actions |
| `--color-danger-soft` | `rgba(239,68,68,0.10)` | `#FDECEC`* | Error alert background |
| `--color-info` | `#60A5FA`* | `#1D4ED8`* | Informational |
| `--color-scrim` | `rgba(0,0,0,0.75)` | `rgba(18,59,53,0.45)`* | Dialog backdrop |
| `--color-focus-ring` | `#00E676` | `#0B8F55` | Focus outline |

\* New values (no current equivalent in that theme) — chosen for WCAG AA and to be confirmed by the Design & Identity committee.

## 3. Contrast notes

Approximate WCAG contrast ratios of current pairs (to be verified with a contrast tool during Phase 1):

| Pair | Ratio (≈) | Result |
| ---- | --------- | ------ |
| `#00E676` on `#050D09` | 13:1 | AAA |
| `#FFFFFF` on `#067847` (register button) | 5.6:1 | AA |
| `#9CA3AF` on `#0D0E12` | 7.4:1 | AA |
| `#0D3329` on `#72C99A` (light primary button) | 6.9:1 | AA |
| `#52766C` on `#F4FAF6` | 4.8:1 | AA (narrow margin) |
| `#067847` on `#E6F4F1` ("available" badge) | 4.9:1 | AA |
| **`#0B8F55` on `#F4FAF6`** (light accent text/links) | **3.9:1** | **Fails AA for normal text** — passes only for large/bold text. Use `#087A48` or darker for small accent text in light theme. |
| `#FFAB00` on dark tinted badge | ≥ 8:1 | AA |

## 4. Token sketch (reference for Phase 1)

```css
/* src/styles/tokens.css — reference, not yet implemented */
:root {
  color-scheme: dark;
  --color-bg: #050d09;
  --color-surface: #0d0e12;
  --color-text: #ffffff;
  --color-text-secondary: #9ca3af;
  --color-accent: #00e676;
  --color-accent-fill: #00e676;
  --color-on-accent-fill: #050d09;
  --color-border: rgb(255 255 255 / 0.15);
  /* … remaining semantic tokens from §2 … */
}
:root[data-theme='light'] {
  color-scheme: light;
  --color-bg: #f4faf6;
  --color-surface: #ffffff;
  --color-text: #123b35;
  --color-text-secondary: #52766c;
  --color-accent: #0b8f55;
  --color-accent-fill: #72c99a;
  --color-on-accent-fill: #0d3329;
  --color-border: #cbe7d4;
}
```

## 5. Rules

1. Components use semantic tokens only; primitives (raw hex) appear only in `tokens.css`.
2. Neon green (`--color-accent`) is never used as a large background area or for long body text.
3. Status always pairs color with text (and ideally an icon).
4. Any new color requires a token entry here and a contrast check in both themes.
