# Public Site — Screen Blueprints

> **Surface:** Every page a visitor can open without the dashboard: home, about, events, articles, members, auth pages, 404, plus the new public pages that later phases add.
> **Rule:** These blueprints record the **current design exactly as it renders today** (captured from the running app on 2026-10-02 at 1440px and 375px). The look is **frozen** ([D-009](../../90-decisions/README.md#2-decision-log)). When a page moves from hardcoded data to the database, it must render pixel-equivalently; only data sources, states and accessibility fixes change.
> **Status:** Design hand-off package, the companion of [`../INTERNAL-SCREENS/`](../INTERNAL-SCREENS/README.md)
> **Last updated:** 2026-10-02

---

## 1. How to read these files

Each file has five parts:

| Section | Contents |
| ------- | -------- |
| **1. Blueprint** | ASCII sketch at desktop (1440px, RTL), plus a mobile (375px) sketch where the layout changes |
| **2. Layout rules (CURRENT)** | Measured sizes, columns, CSS classes in use; what to keep |
| **3. States** | CURRENT states, and the TARGET states that must be added *without changing the look* (skeleton, empty, error) |
| **4. Data** | CURRENT source (hardcoded / Supabase) → TARGET source (table or view, [module](../../11-modules/README.md)) |
| **5. Known issues** | PROBLEM items from the [audit](../../01-project/current-system-audit.md) that a later phase fixes. They are listed here so nobody "fixes" them ad hoc |

Example people in the sketches are **fictional**; the live pages use real names from the database or hardcoded data.

## 2. Screen inventory

| # | File | Route(s) | Phase that touches it |
| - | ---- | -------- | --------------------- |
| 00 | [`00-public-chrome.md`](./00-public-chrome.md) | Header, footer, search overlay, theme/language toggles (all pages) | 1 (i18n routing), 2 (account menu) |
| 01 | [`01-home.md`](./01-home.md) | `/` | 3A, 3C (latest events and threads from the DB) |
| 02 | [`02-about.md`](./02-about.md) | `/about` | 4 (leadership from positions, optional) |
| 03 | [`03-events-list.md`](./03-events-list.md) | `/events` | 3A |
| 04 | [`04-event-detail.md`](./04-event-detail.md) | `/events/[slug]` (+ registration dialogs) | 3A, 4 (check-in link) |
| 05 | [`05-articles-list.md`](./05-articles-list.md) | `/articles` | 3C |
| 06 | [`06-article-detail.md`](./06-article-detail.md) | `/articles/[slug]` | 3C |
| 07 | [`07-members.md`](./07-members.md) | `/members` (+ `/members/all` redirect) | 2 (leadership), 3B (directory) |
| 08 | [`08-member-profile.md`](./08-member-profile.md) | `/members/[id]` | 3B |
| 09 | [`09-auth-pages.md`](./09-auth-pages.md) | `/login`, `/register`, `/forgot-password`, `/reset-password` | 2 |
| 10 | [`10-not-found.md`](./10-not-found.md) | 404 (`not-found.tsx`) | 1 |
| 11 | [`11-committee-legacy.md`](./11-committee-legacy.md) | `/committee` (retired in 3A) | 3A |
| 12 | [`12-new-public-pages.md`](./12-new-public-pages.md) | `/join`, `/events/[slug]/check-in`, `/certificates/[id]`, `/privacy`, `/search` | 3A–5 |
| 80 | [`80-public-flows.md`](./80-public-flows.md) | Visitor journeys: browse → register, sign up, reset password, join, check-in | — |

## 3. Shared visual language (observed)

| Element | Observed spec (dark theme) | Used on |
| ------- | -------------------------- | ------- |
| Page banner | Full-bleed, 164px tall, green-tinted gradient + pattern; breadcrumb (14px) above a 38px bold title, aligned to the inline start | About, events, event detail, articles, article detail, member profile |
| Container | `max-width: 1200px` (header/footer 1280px); 24px side gutter on content pages, 113px effective margin at 1440px on home | All |
| Section title | 32–40px bold, inline-start aligned (centered for home community/members) | Home, members |
| Card | Surface `#0D0E12`-ish, 1px translucent green border, 16–20px radius, green glow on hover | Event cards, article cards, member cards, detail cards |
| Primary button | Capsule, neon green `#00E676` fill, dark text | Login, register, card *Register* |
| Secondary button | Capsule, outline or dark green fill with green border | *Read more*, *View all*, *Vision* |
| Tag pill | 26px capsule, muted green fill, 12–13px text | Event and article tags, member skills |
| Status badge | Small rounded rectangle on the card image's top inline-start corner: *قريبًا* (amber), *منتهي* (grey) | Event cards |

Tokens behind these values: [foundations/colors](../foundations/colors.md), [typography](../foundations/typography.md), [layout-and-shape](../foundations/layout-and-shape.md).

## 4. Target additions that keep the look

| Addition | Where | Rule |
| -------- | ----- | ---- |
| Skeletons | Lists and detail pages once data comes from the DB | Reuse the existing `.sdc-skel` shimmer already used on `/members` (it is the public skeleton style) |
| Empty states | Lists | Centered muted text + one secondary button, inside the existing container |
| Error states | Lists and detail | Same as empty, with a *Try again* button; never a raw error message |
| Focus rings | Every interactive element | 2px accent outline, 2px offset (not visible today — [accessibility](../accessibility.md)) |
| `next/image` | All images | Same rendered size and crop; adds `width`/`height` and lazy loading |
