# Patterns

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Public page skeleton

```text
┌──────────────────────────── SiteHeader (sticky) ────────────────────────────┐
│ PageHeader: breadcrumbs · title · (actions)            [full-bleed banner]   │
├──────────────────────────────── Container ───────────────────────────────────┤
│ Content (sections separated by --space-16; SectionHeading per section)       │
├──────────────────────────────── SiteFooter ──────────────────────────────────┤
```

- One `<h1>` per page (the PageHeader title); home uses the hero title as `<h1>`.
- Landmarks: `header`, `nav`, `main`, `footer`; skip-to-content link.

## 2. Listing with filters (events, articles, members)

| Element | Rule |
| ------- | ---- |
| Filters | In the URL (`?type=workshop&period=upcoming`), shareable, server-rendered results |
| Filter UI | Inline chips on desktop; `Drawer` on mobile (members' current filter panel becomes this) |
| Search | Text field filtering the current list (server-side query), not a global overlay (**OPEN Q-023**) |
| Results | Card grid; result count announced (`aria-live="polite"`) |
| Empty | `EmptyState` with a reset-filters action |
| Loading | Skeleton cards matching the final layout |
| Pagination | When > 24 items |

## 3. Detail with sidebar (event)

Current event detail layout is kept: banner with title and primary action (Register) → about-the-community block → two columns: main detail cards (responsibilities, requirements, deliverables, benefits) and a facts sidebar (audience, location, date, duration, awards, FAQ, contact, socials).

Target adjustments: replace the repeated "About the community" paragraph with the event summary/description; facts sidebar becomes `EventFacts`; the registration action shows state (`Register` / `Pending review` / `Accepted ✓` / `Waitlisted` / `Registration closed` / `Event ended`) with one consistent component; on mobile the action sticks to the bottom.

## 4. Auth card

Centered `Card variant="accent-top"` (max-width 440px) on the canvas: title, subtitle, form, footer link. Back-to-home link at the top inline-start. Same layout for login, register, forgot/reset password, and the claim-profile flow.

## 5. Gated page: membership intake (`/join`)

| Cycle state | Layout |
| ----------- | ------ |
| Closed / none | PageHeader + `EmptyState`-style panel: "Applications are closed" + optional next-cycle text + social links |
| Scheduled | Panel with opening date (`DateTime`) and reminder to create an account |
| Open, signed out | Panel explaining the process + "Sign in to apply" / "Create account" |
| Open, signed in | `Stepper` form: personal → academic/professional → links & bio → cycle questions → consent & review |
| Already applied | Status panel with the application state and edit/withdraw while allowed |
| Closed, awaiting decisions | Status panel |

## 6. Dashboard (new)

```text
┌ Top bar: logo · environment badge (non-prod) · language · theme · user menu ┐
├ Sidebar (inline-start)  ┬ Content                                            ┤
│ Overview                │ PageHeader (title, primary action)                │
│ Events                  │ Tabs / filters                                    │
│ Registrations           │ Table with selection → bulk-action bar            │
│ Articles                │ Detail panels / forms                             │
│ Membership              │                                                   │
│ Committees · Members    │                                                   │
│ Reports · Admin         │                                                   │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

- Sidebar items appear only if the user holds a related permission (UX only).
- Status everywhere uses `Badge` with the lifecycle vocabulary from the glossary.
- Review queues show counts in the sidebar.
- Bulk actions: select rows → action bar → `ConfirmDialog` stating the count and the effect (e.g., "Accept 12 registrations and email them").
- Lifecycle actions are buttons named by the transition ("Submit for review", "Approve & publish", "Request changes"), and show a short history timeline (from audit/transition columns).

## 7. Forms

- Sections with headings for long forms (event form: Basics · Schedule & place · Registration · Details · Media).
- Required fields marked with text ("required"), not only `*`.
- Bilingual fields side by side on desktop (Arabic first, `dir="rtl"`; English `dir="ltr"`), stacked on mobile.
- Save draft explicitly; warn on navigation with unsaved changes.
- Server errors map to fields; a summary `Alert` at the top for non-field errors.

## 8. States

| State | Pattern |
| ----- | ------- |
| Loading (page) | Route `loading.tsx` with skeletons |
| Loading (action) | Button `loading`, form disabled |
| Empty | `EmptyState` with next step |
| Error (page) | `error.tsx` with retry and home link, localized |
| Not found / not permitted | Localized 404 (permission denial for existence-sensitive resources also returns 404) |
| Success | `Toast` for in-place actions; dedicated confirmation for flows (registration, application) |
| Destructive | `ConfirmDialog` naming the object |
