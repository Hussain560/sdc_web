# Components

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Part 1 inventories what exists (CURRENT), with measured specs so the look can be reproduced. Part 2 defines the target primitive library (TARGET) that replaces the per-page copies.

---

## Part 1 — Current component inventory

### 1.1 Header

| Property | Value |
| -------- | ----- |
| File | `src/components/Header/Header.jsx` + `.css` |
| Behaviour | Sticky top, `z-index 1000`; logo (theme variant) · nav (About, Events, Members, + "لوحة اللجنة" for the hardcoded reviewer) · theme toggle · search (opens overlay) · language toggle · user name + logout **or** login button |
| Surface | `#0D0E12`, bottom border `rgba(0,230,118,0.15)`; light: `#F3F9F6`, border `#D8EDE0` |
| Container | `max-width 1280px`, padding `14px 24px`, gap 28px |
| Nav links | 15px / 500, `#E5E7EB`; hover/active accent |
| Header button (`.sdc-btn-primary`) | **Outline capsule**: transparent, 1px `rgba(255,255,255,0.3)`, padding `8px 24px`, radius 50px, 14px/600; hover border+text `#00E676`, bg `rgba(0,230,118,0.05)`. (Named "primary" but visually secondary.) |
| Issues | Icon-only theme button without label; search submits to a non-existent `/search`; nav has no "Articles" link; committee link based on hardcoded emails; no mobile menu (items wrap at ≤ 992px) |

### 1.2 Footer

| Property | Value |
| -------- | ----- |
| Content | "Follow us" + Instagram (placeholder link), LinkedIn, X · copyright · "developed by" · vertical logo |
| Surface | `#050D09`, top border `rgba(255,255,255,0.15)`, padding `30px 48px 40px` |
| Issues | Hardcoded year; stale "last updated 2020" string in dictionary; external placeholder fallback image |

### 1.3 Hero

Two-column (text + logo art), title `3.2rem/800`, description `1.15rem`, CTA "Community Vision" → `/about`. Section bg `#08090C` / light `#F4FAF6`.

### 1.4 Page banner (hero banner with breadcrumb)

Used on events, articles, members, about, event and article detail pages; each page re-implements it (`.sdc-events-hero-banner`, `.sdc-articles-hero-banner`, …). Fixed height 164px, bg `#050D09` + background image, inline breadcrumb (`Home > Section > Current` with `>` separator and current item in `#00E676`), title `1.6rem/800`.

### 1.5 Section heading

Title (`2rem/800` on home, smaller elsewhere) with an accent bar `46×3px #00E676 radius 2px` (`.sdc-section-heading-bar`); optional "View all" ghost capsule button.

### 1.6 Buttons (observed variants)

| Variant (current class) | Look | Used for |
| ----------------------- | ---- | -------- |
| Filled accent capsule (`.sdc-login-submit-btn`) | bg `#00E676`, text `#050D09`, radius 50px, 0.95rem/700; hover `#00C853`. Light: `#72C99A` / `#0D3329`, hover `#5DB987` | Auth submit |
| Filled deep-green capsule (`.sdc-btn-register`) | bg `#067847`, white text, padding `6px 22px`, 0.85rem/700; hover `#ABEFC6` + black text. Light: `#72C99A` / `#0D3329` | Event "Register" |
| Registered state (`.registered`) | Disabled look, label "Registered ✓" | — |
| Outline capsule (`.sdc-btn-primary`, `.sdc-btn-more`) | Transparent + translucent border | Header login/logout, "Read more" |
| Ghost capsule (`.sdc-view-all-btn`) | bg `rgba(255,255,255,0.03)`, border `rgba(255,255,255,0.25)` | "View all" |
| Outline block (`.sdc-card-info-btn`) | Full width, 1.5px border, radius 12px | Member card "Professional info" |
| Dialog confirm (`.sdc-btn-confirm`) | Filled accent, radius **8px** | Modal confirm |
| Dialog cancel (`.sdc-btn-cancel`) | Transparent, white text, radius 8px | Modal cancel |
| Inline-styled accept/reject | Inline styles in `/committee` (green fill / red outline, radius 6px) | Committee page |

### 1.7 Cards

| Card | Spec |
| ---- | ---- |
| Home event card (`.sdc-event-card`) | Row layout: image + details; bg `#0D0E12`, border `1.5px rgba(171,239,198,0.3)`, radius 20px, padding 16px, gap 20px; hover border `#ABEFC6` + glow |
| Event grid card (`.sdc-event-full-card`) | Image top with status badge, title, meta (location, date with green icons), actions (Register + Read more) |
| Article card (`.sdc-article-figma-card`) | Icon circle (BookOpen), title, "By:" author, date + read time, tag pills, "Read thread" button |
| Member card (`.sdc-member-card`) | Gradient bg `#0D1512 → #0A0F0C` (light `#FFFFFF → #F7FCF9`), border `rgba(0,230,118,0.14)` (light `#CBE7D4`), radius 18px, padding `22px 20px`, gap 12px; avatar 52px circle with initial on gradient `#00E676 → #00B85C`; name 1.05rem/700 (ellipsis); role 0.82rem `#56987B`; university row with icon; tag pills; full-width info button; hover lift + glow (light hover border `#16A765`) |
| Detail section card (`.sdc-detail-card`) | Event detail lists (responsibilities, requirements, deliverables, benefits) with emoji icon "📋" header |
| Sidebar facts card (`.sdc-sidebar-card`) | Event facts with lucide icons in `#7AAF98`: audience, location (link), date, duration, awards, FAQ, phone, email, socials |
| Vision/mission card (`.sdc-vm-card-box`) | About page; icon + text |
| Category card (`.sdc-category-card`) | Community sections; alternating top/bottom accent border (`border-top-only` / `border-bottom-only`) |
| Auth card (`.sdc-login-card`) | bg `#0D0E12`, border `rgba(0,230,118,0.3)` with **2px accent top border**, radius 20px, padding `40px 32px`, max-width 420px, shadow `0 10px 30px rgba(0,0,0,0.5)`; light: white, border `#CBE7D4`, top `#72C99A` |

### 1.8 Badges, tags and pills

| Element | Spec |
| ------- | ---- |
| Status badge (`.sdc-badge-status`) | Absolute top-right on image, 0.72rem/800, padding `4px 10px`, radius 6px. `available`: bg `#E6F4F1`, text `#067847`. `coming-soon`: bg `rgba(255,171,0,0.2)`, text/border `#FFAB00`, blur. (Uses physical `right: 8px` — does not mirror.) |
| Event category tags (`.sdc-tag`) | White bg, 0.75rem/800, radius 6px, colored text per category; **hardcoded "Competitions / Technology / Students" on every home event** (fake data) |
| Tag pill (`.sdc-tag-pill`) | 0.72rem, padding `4px 11px`, radius 20px, border `rgba(255,255,255,0.14)`, bg `rgba(255,255,255,0.03)`, text `#C9D3CE`; `.tag-green` (selected/first): bg `rgba(0,230,118,0.12)`, border+text `#00E676` (light `#E5F5EA` / `#72C99A` / `#0D3329`) |
| Member/visitor badge | Inline styles in `/committee`: green tint "عضو" / amber tint "زائر" |

### 1.9 Forms

| Element | Spec |
| ------- | ---- |
| Field group (`.sdc-form-group`) | Label above input |
| Input | bg `#16181D`, border `1px rgba(255,255,255,0.15)`, radius 10px, padding `12px 16px`, 0.95rem, white text; focus border `#00E676` + glow `0 0 8px rgba(0,230,118,0.2)`, `outline: none` (**no visible focus ring beyond color**); light: bg `#F8FCF9`, border `#CBE7D4`, placeholder `#8AA39C` |
| Helper text | 12px `#9AA0A6` (inline style) |
| Error alert | Inline style: bg `rgba(239,68,68,0.1)`, border `#EF4444`, text `#EF4444`, radius 8px |
| Success alert | Inline style: bg `rgba(0,230,118,0.1)`, border+text `#00E676` |

### 1.10 Overlays

| Element | Spec |
| ------- | ---- |
| Dialog (`.sdc-modal-overlay` + `.sdc-modal-card`) | Scrim `rgba(0,0,0,0.75)` + 4px blur, z 1000; card `#0D1117`, border `rgba(0,230,118,0.3)`, radius 16px, padding 24px, max-width 440px; close (X) top corner; header icon (CheckCircle 40px); footer confirm/cancel. Closes on backdrop click; **no Escape, no focus trap, no `role="dialog"`**. Defined in 3 CSS files. |
| Search overlay | Full-screen scrim with centered input; filters page content via global context |
| Filter panel (`/members`) | Popover/drawer with header (title + count), collapsible sections (university, major, sub-major, status, track) with custom checkboxes, footer Reset/Apply |

### 1.11 Feedback and misc.

| Element | Spec |
| ------- | ---- |
| Skeleton | Shimmer gradient (1.4s), radius 8px; member card skeleton (avatar 52px, lines, pills, button) |
| Empty state | Text only (`.sdc-no-results`) |
| Loading text | "جاري التحميل..." centered text (committee, member detail) |
| 404 | 10.5rem numeral `#C2E7D5` surrounded by 12 scattered icon images; title "حدث خطأ"; back-home button; Arabic only |
| Breadcrumb component | `src/components/Breadcrumb` — **unused** |
| Partner slider | Horizontal scroll list with arrow buttons; 12 placeholder logos |
| Avatar group | Home members teaser: "+" link + 4 placeholder user icons |

---

## Part 2 — Target primitive library (`src/components/ui`)

Every primitive: semantic tokens only, RTL-safe, keyboard accessible, both themes, documented props, unit/behaviour tested.

| Primitive | Variants / props | Replaces | Accessibility notes |
| --------- | ---------------- | -------- | ------------------- |
| `Button` | `variant`: `primary` (accent fill) · `secondary` (deep-green fill) · `outline` · `ghost` · `danger`; `size`: `sm` `md` `lg`; `loading`; `fullWidth`; capsule shape | All button classes in §1.6 | Native `<button>`; loading sets `aria-busy`; disabled vs. `aria-disabled` documented |
| `IconButton` | `label` (required), `variant` | Theme toggle, close buttons, slider arrows | Requires accessible name |
| `LinkButton` | Same variants for navigation | "Read more", "View all" | Renders `<a>` via `next/link` |
| `Badge` | `tone`: `neutral` `accent` `success` `warning` `danger` `info`; `size` | Status badges, member/visitor badge | Text always present |
| `Chip` / `Tag` | `selected`, `removable`, `as="button"` for filters | Tag pills, filter options | `aria-pressed` when toggleable |
| `Card` | `variant`: `surface` `interactive` `accent-top`; slots: media, header, body, footer | All card types in §1.7 (domain cards compose it) | Interactive cards use a single primary link, not nested links |
| `PageHeader` | `title`, `breadcrumbs`, `actions`, optional background image | Per-page banners (§1.4) | Breadcrumbs in `<nav aria-label>` with `aria-current` |
| `SectionHeading` | `title`, `action` | §1.5 | Proper heading level prop |
| `Breadcrumbs` | items | Inline breadcrumbs | Directional separator mirrors |
| `Field` | label, hint, error, required | `.sdc-form-group` | `aria-describedby`, `aria-invalid` |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` | sizes, `dir` for ltr-only inputs | Inputs, filter checkboxes | Visible focus ring (`--color-focus-ring`, 2px, offset 2px) |
| `Alert` | `tone`: success/error/warning/info; `title` | Inline-styled alerts | `role="alert"` for errors, `status` otherwise |
| `Dialog` | `title`, `description`, footer actions; `size` | Modal copies (§1.10) | Built on Radix Dialog: focus trap, Escape, `aria-modal`, restores focus |
| `ConfirmDialog` | destructive variant names the object | Accept/reject, cancel event | — |
| `Drawer` (Sheet) | side = inline-end | Filter panel, mobile nav | Same as Dialog |
| `Tabs` | — | Event manage pages (dashboard) | Roving tabindex |
| `Table` | sortable headers, selection, bulk-action bar, empty state | Dashboard lists (new) | `<table>` semantics, captions |
| `Pagination` | page/size | Lists | `nav` landmark |
| `Avatar` | image or initial; sizes | Member avatar | `alt` or `aria-hidden` with adjacent name |
| `Skeleton` | shapes | §1.11 | `aria-hidden`; container `aria-busy` |
| `EmptyState` | icon, title, description, action | `.sdc-no-results` | — |
| `Toast` | success/error | — (new) | Polite live region |
| `StatCard` | label, value, delta | Reports (new) | — |
| `DateTime` | formats via shared formatter | Display strings | `<time dateTime>` |
| `Stepper` | steps | Event creation form, application form (new) | `aria-current="step"` |

Layout components (`src/components/layout`): `SiteHeader` (with mobile menu `Drawer`), `SiteFooter`, `DashboardShell` (sidebar with permission-filtered items, top bar, content), `Container`.

Domain components (in `modules/*/components`): `EventCard`, `EventFacts` (sidebar), `RegistrationButton`, `RegistrantsTable`, `ArticleCard`, `MemberCard`, `LeadershipGrid`, `ApplicationForm`, `CycleStatusPanel`, etc. — composed from primitives.
