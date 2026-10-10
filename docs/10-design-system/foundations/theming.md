# Theming (Dark / Light)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Design System v2, approved 2026-10-10 ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

## 1. Mechanism (unchanged, keep)

1. An inline script in `app/[locale]/layout.tsx` reads `localStorage['sdc_theme']` and sets `<html data-theme>` before first paint. The default is `dark`; errors fall back to dark.
2. `ThemeContext` mirrors and persists the value.
3. `<html suppressHydrationWarning>`.

## 2. Rules (v2)

| Aspect | Rule |
| ------ | ---- |
| Source of truth | `tokens.css`: `:root` = dark, `:root[data-theme='light']` = light. Components never branch on the theme. |
| `color-scheme` | `dark` / `light` per theme, so native controls, scrollbars and date pickers match |
| Default | Dark (brand). Q-044 (follow the OS when nothing is stored?) stays open; the owner decides. |
| Complete light theme | Every component and page is designed and reviewed in **both** themes. Light isn't an inversion: it has its own accent text green (`#0A7A49`), its own warning/danger/info, and a mint `--band`. |
| Assets | Theme variants switch in CSS so the server render is right: `<img class="theme-dark-only">` + `<img class="theme-light-only">`, with `[data-theme='light'] .theme-dark-only { display: none }`. Header logo: `Full whiteLogo 1.png` (dark) / `navbar.png` (light). Hero art: `hero-logo.png` / `light-mode.png`. |
| Logo on surfaces | The white wordmark only on dark surfaces; the full-colour wordmark only on light. No other recolouring ([logo component](../components.md#41-logo)). |
| Toggle | Icon button, 44 px, `aria-label` names the action ("التبديل إلى الوضع الفاتح" / "Switch to light mode") and `aria-pressed` reflects light mode. Sun shown in dark, moon in light. |
| Photos | User photos and event covers are never tinted per theme. They get a 1 px `--border` so a white photo doesn't melt into the light canvas. |
| E-mail | Light only (unchanged). |
| Testing | Every component story and page snapshot × {dark, light} × {ar, en}. |
