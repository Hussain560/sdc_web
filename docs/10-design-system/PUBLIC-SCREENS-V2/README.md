# Public Site v2 — Page Specifications

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-10 |
| **Status**       | Draft — Part 2 of the [public redesign brief](../CLAUDE-DESIGN-PROMPT-PUBLIC-REDESIGN.md), on [Design System v2](../README.md) ([ADR-014](../../90-decisions/ADR-014-public-redesign-design-system-v2.md)) |

> These specs replace the frozen-look blueprints in [`../PUBLIC-SCREENS/`](../PUBLIC-SCREENS/README.md) as the **target** for every public route. The old folder stays as the record of the current pages (and of the data and state rules that still apply).

## 1. How to read these files

Each page file has the same parts:

| Part | Contents |
| ---- | -------- |
| **Purpose** | What the page is for, in one or two sentences |
| **Wireframe** | ASCII, **Arabic RTL** at 1440 px (the inline-start is on the right), plus 360 px where the layout changes. English mirrors it. |
| **Sections** | Each block: the [pattern](../patterns.md)/[components](../components.md) used, the content and its rules |
| **States** | Every state the page can be in, and what changes |
| **Data** | The query, view or setting each block reads ([§4](#4-data-sources)), and the gaps |
| **Copy** | The key strings in Arabic and English (placeholders where the copy belongs to the owner) |
| **Media** | The images the page needs, by id from the [media list](./30-media-list.md) |

Placeholders are always written `‹PLACEHOLDER: …›` in the specs and labelled "(عنصر نائب)" / "PLACEHOLDER" in design files. **None of them ships.** A block whose data does not exist is hidden, not faked.

## 2. Page inventory

| # | File | Routes | Flagship |
| - | ---- | ------ | -------- |
| 00 | [00-chrome.md](./00-chrome.md) | Header, footer, mobile menu, skip link, search (all public pages) | |
| 01 | [01-home.md](./01-home.md) | `/` | ★ |
| 02 | [02-event-page.md](./02-event-page.md) | `/events/[slug]`, the registration dialog, `/events/[slug]/check-in` | ★ |
| 03 | [03-events-list.md](./03-events-list.md) | `/events` | |
| 04 | [04-members.md](./04-members.md) | `/members`, `/members/[id]` (`/members/all` → redirect) | ★ |
| 05 | [05-auth.md](./05-auth.md) | `/login`, `/forgot-password`, `/reset-password`, `/claim/[token]` (`/register` → `/join`) | |
| 06 | [06-about.md](./06-about.md) | `/about` | |
| 07 | [07-articles.md](./07-articles.md) | `/articles`, `/articles/[slug]` | |
| 08 | [08-committees.md](./08-committees.md) | `/committees/[slug]`, proposed `/committees` | |
| 09 | [09-join.md](./09-join.md) | `/join` | |
| 10 | [10-certificate.md](./10-certificate.md) | `/certificates/[id]` | |
| 11 | [11-privacy-and-not-found.md](./11-privacy-and-not-found.md) | `/privacy`, 404 (`[...rest]`, `not-found.tsx`) | |
| 20 | [20-suggested-additions.md](./20-suggested-additions.md) | Proposed pages and sections, marked *launch* or *later* | |
| 30 | [30-media-list.md](./30-media-list.md) | Every image, illustration and video the design needs | |
| 90 | [90-open-questions.md](./90-open-questions.md) | Decisions that belong to the owner, and the data gaps | |

## 3. Rules every page follows

1. **Chrome:** the [floating header and footer](./00-chrome.md) on every page **except** the auth pages, which use their own layout ([05-auth.md](./05-auth.md)).
2. **One `h1` per page.** The home hero uses `t-display`; every other page starts with `t-h1` in a page header (breadcrumb → title → lede → actions or filters).
3. **Rhythm:** sections are separated by `--section-gap` (64 → 120 px). Alternate sections may sit in a `--band` with `--radius-2xl`. Never two bands in a row.
4. **Both languages and both themes** for every page; English mirrors the Arabic layout. Routing uses `Link` and `useRouter` from `@/i18n/navigation`; English lives under `/en`.
5. **Published content only.** Every public query reads a public view (`public_events`, `public_articles`, `member_directory`, `current_positions`) or a public setting. Permissions come from the database; the UI never checks hard-coded roles.
6. **Privacy:** no personal field is shown without its consent flag. Hidden or unknown people and objects return 404, never "exists but hidden".
7. **States everywhere:** loading (skeletons with the final geometry), empty, no-results, error (with a retry), and not-found.
8. **Real data or nothing:** figures, partners, testimonials and quotes appear only from real data. Otherwise the block is hidden.

## 4. Data sources

| Source | Kind | What it gives | Used by |
| ------ | ---- | ------------- | ------- |
| `public_events` | view | Published, cancelled, completed and archived events, with the derived `phase`, `seats_left`, committee, goals, FAQ, details, display flags | Home, events, event page, committee page |
| `event_dates` | table (public read) | Each date of an event with its own start/end time | Event page agenda |
| `event_presenters` | table | Presenters, mentors, judges, hosts (guest name/title/photo/link or a profile) | Event page speakers |
| `public_articles` | view | Published articles | Home, articles, committee page, member profile |
| `member_directory` | view | Active members who opted in, public columns only | Members directory and profile |
| `current_positions` | view | Active public roles (founders, leader, advisor, committee leads) | Members (leadership), about, committee page |
| `committees` (public columns) | table | Committee name, slug, description | Committees, filters |
| `partners` | table | Active partners: name, logo, site, order | Home partner strip |
| `membership_cycle_phase` | view | The current intake cycle and its phase | Home CTA, join |
| `site_settings` (public keys) | table | Social links, contact e-mail, footer rights | Footer |
| `verify_certificate()` | RPC | Certificate facts by id | Certificate page |
| `check_in_public_context()` | RPC | Session and event for check-in | Check-in page |
| `register_guest()` / `registerForEvent()` | RPC / action | Registration result (`accepted`, `pending`, `waitlisted`) or an error code | Registration dialog |

**Data gaps** (the design needs something the schema doesn't have yet) are listed per page and collected in [90-open-questions.md §2](./90-open-questions.md#2-data-gaps). The design never fills a gap with invented content.
