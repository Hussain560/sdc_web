# Theming (Dark / Light)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Current mechanism (CURRENT — keep)

1. `app/layout.js` injects an inline script in `<head>` that reads `localStorage['sdc_theme']` and sets `<html data-theme="dark|light">` **before first paint** (default `dark`; errors fall back to dark).
2. `ThemeContext` mirrors the value in React, toggles it, and persists it.
3. `<html suppressHydrationWarning>` avoids hydration warnings for the attribute.
4. The header toggle shows a sun (in dark) / moon (in light); logos and hero art switch by theme.

This is the correct pattern and stays.

## 2. Problems (PROBLEM)

| Problem | Effect |
| ------- | ------ |
| Light theme implemented as ~250 per-class overrides with hex values | Every new component needs two hand-written styles; easy to miss (e.g., status badges, committee page inline styles have no light variant) |
| Inline styles with dark hex values (`/committee`, auth alerts, home `<main style={{ backgroundColor: '#0D0E12' }}>`) | These areas stay dark in light theme |
| Theme toggle button has no accessible name | Screen readers announce an unlabeled button |
| Theme-specific images chosen in JS (`isDarkMode ? … : …`) | Server render always uses the dark asset until hydration |
| System preference ignored | Default is always dark (intended), but users get no automatic match |

## 3. Target

| Aspect | Rule |
| ------ | ---- |
| Source of truth | Semantic tokens in `tokens.css` switch under `:root[data-theme='light']`; components never branch on theme |
| Default | Dark (brand decision); stored preference wins; **OPEN Q-044** — follow `prefers-color-scheme` when no preference is stored? |
| `color-scheme` | Set per theme so native controls (scrollbars, date pickers) match |
| Assets | Theme variants via CSS (`[data-theme='light'] .logo-dark { display:none }`) or `<picture>` so the server render is correct |
| Toggle | Icon button with `aria-label` ("التبديل إلى الوضع الفاتح" / "Switch to light mode") and `aria-pressed` |
| Email | Emails are light-only (email clients' dark-mode handling is inconsistent) |
| Testing | Every component story/screenshot checked in both themes ([manual QA](../../09-quality/manual-qa-checklist.md)) |
