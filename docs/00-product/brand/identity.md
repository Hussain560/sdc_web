# Brand Identity

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Name

| Form | Arabic | English |
| ---- | ------ | ------- |
| Full | المجتمع السعودي للمطورين | Saudi Developer Community |
| Short | — | SDC |
| With acronym (page titles) | المجتمع السعودي للمطورين (SDC) | Saudi Developer Community (SDC) |

**PROBLEM** — the English name appears inconsistently in the codebase: "Saudi Developer Community", "Saudi Developers Community" (founder bios), "the Saudi community" (about text), and "All rights reserved for the Saudi Community". Use **Saudi Developer Community** everywhere.

## 2. Logo assets (CURRENT)

All in `public/assets/`. File names contain spaces, which must be avoided in the target (see [design system § assets](../../10-design-system/README.md#5-assets)).

| File | Used for | Theme |
| ---- | -------- | ----- |
| `Full whiteLogo 1.png` | Header logo | Dark theme |
| `navbar.png` | Header logo | Light theme |
| `hero-logo.png` | Hero illustration | Dark theme |
| `light-mode.png` | Hero illustration | Light theme |
| `Logos.png` | Footer vertical logo | Both |
| `Full darkLogo1.jpg` | Not referenced | — |
| `Featured icon.png` | Generic icon on about/sections cards | Both |
| Remote `storage/v1/object/public/assets/cds.jpg` | Email header banner (hosted in the remote Supabase project's public `assets` bucket) | Email |

**OPEN Q-041** — is there a master brand kit (vector logo, clear-space rules, approved color values) owned by the Design & Identity committee? The repository only contains raster exports.

## 3. Brand colors (observed)

The site uses a **green-on-near-black** identity. Full token mapping lives in [design system colors](../../10-design-system/foundations/colors.md).

| Role | Value | Where |
| ---- | ----- | ----- |
| Signature accent (neon green) | `#00E676` | Primary buttons, active links, highlights (dark theme) |
| Deep brand green | `#067847` | Register buttons, "available" badges |
| Email brand green | `#286A5E` | Email header band |
| Near-black canvas | `#050D09` / `#08090C` / `#0D0E12` | Dark theme backgrounds |
| Mint canvas | `#F4FAF6` | Light theme background |
| Forest text | `#123B35` | Light theme text |

**PROBLEM** — email templates use `#286A5E`, which does not appear anywhere in the web UI. The brand needs one canonical primary green per medium (**OPEN Q-041**).

## 4. Typography (brand level)

| Script | Typeface | Source |
| ------ | -------- | ------ |
| Arabic | IBM Plex Sans Arabic | Google Fonts |
| Latin | Rubik | Google Fonts |

## 5. Social channels (CURRENT links)

| Channel | Status |
| ------- | ------ |
| X — `@SDC_Saudi` | Linked (two different URL variants in header/footer and event pages) |
| LinkedIn company page | Linked |
| Instagram | **PROBLEM** — links to `https://instagram.com` root, not an SDC account |

Social links should be stored once (configuration) and reused, not repeated in components.
