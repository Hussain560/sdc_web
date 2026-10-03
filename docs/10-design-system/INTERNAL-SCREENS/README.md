# Internal Dashboard — Screen Blueprints

> **Surface:** Signed-in area only (`/dashboard/**`, `/account/**`) plus the new `/join` page.
> **Public pages:** unchanged — home, about, events, articles, members, auth pages keep their current design (decision for this phase). Their blueprints are in [`../PUBLIC-SCREENS/`](../PUBLIC-SCREENS/README.md).
> **Status:** Design hand-off package (ASCII blueprints + layout rules + states + data)
> **Last updated:** 2026-10-02

---

## 1. Purpose of this folder

The design hand-off package for SDC's **internal view**: the L-frame shell (sidebar + private header + content, modelled on the KFUCS portal), **permission-driven conditional rendering**, the **skeleton loading system**, and every internal screen and flow needed to replace the hardcoded data and the `/committee` page.

Each file follows the Noviq screen-blueprint format: **1. Blueprint** (ASCII) → **2. Layout rules** → **3. States** (always including the skeleton) → **4. Data & permissions**. Hand the folder to a designer (or Claude Design — see [`90-claude-design-prompt.md`](./90-claude-design-prompt.md)) together with [`../README.md`](../README.md) (tokens and components).

## 2. Scope (locked for this package)

| Decision | Value |
| -------- | ----- |
| **Shell** | One shell for every signed-in user. The **sidebar content** changes with permissions; the shell does not. |
| **Authorization in UI** | Navigation and actions are **hidden** when the user lacks the permission, **disabled with a reason** only when the permission exists but the record's state forbids the action. The server and RLS remain the real enforcement ([authorization model](../../06-security/authorization-model.md)). |
| **Loading** | Structured **skeletons** that match the final layout. No spinners except inside buttons. |
| **Theme / language** | Dark default + light; Arabic RTL default + English LTR — every screen mirrors with logical properties. |
| **Icons** | `lucide-react` (already in use). Blueprints use emoji only as shorthand. |
| **Public pages** | Not redesigned here. `/join` is new and uses the existing public visual language. |
| **Events** | KFUCS 4-step wizard, attendance sessions (QR / online / manual) and certificates model — [ADR-012](../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md). Certificate issuance stays behind a setting until Q-020. |
| **Deferred** | Partners management (Q-021), event-scoped presenter grants, notifications centre (email only). |

Canonical fields, badge palettes and allowed-action matrices: [`00-data-model-reference.md`](./00-data-model-reference.md).

## 3. Screen inventory

### Foundations

| # | File | Topic |
| - | ---- | ----- |
| 00 | [`00-data-model-reference.md`](./00-data-model-reference.md) | Fields (input vs read-only), validation, status palettes, allowed actions |
| 01 | [`01-shell-layout.md`](./01-shell-layout.md) | L-frame shell: sidebar + private header + content, responsive behaviour |
| 02 | [`02-sidebar-navigation.md`](./02-sidebar-navigation.md) | Sidebar groups, items, permission keys, badges, committee switcher |
| 03 | [`03-conditional-rendering.md`](./03-conditional-rendering.md) | Access context, `can()`, hide vs disable, role → view matrix, 403 |
| 04 | [`04-skeleton-loading.md`](./04-skeleton-loading.md) | Skeleton primitives, per-screen skeleton anatomy, rules |

### Screens

| # | File | Route | Audience |
| - | ---- | ----- | -------- |
| 10 | [`10-dashboard-overview.md`](./10-dashboard-overview.md) | `/dashboard` | Everyone signed in (role-aware) |
| 11 | [`11-account-area.md`](./11-account-area.md) | `/account/*` | Everyone signed in |
| 12 | [`12-events-list.md`](./12-events-list.md) | `/dashboard/events` | Committee roles, leader, admin |
| 13 | [`13-event-form.md`](./13-event-form.md) | `/dashboard/events/new`, `/[id]/edit` — 4-step wizard | Committee roles, leader |
| 14 | [`14-event-detail-review.md`](./14-event-detail-review.md) | `/dashboard/events/[id]` | Committee roles, approvers |
| 15 | [`15-event-registrations.md`](./15-event-registrations.md) | `/dashboard/events/[id]/registrations` | Reviewers in scope |
| 16 | [`16-event-attendance.md`](./16-event-attendance.md) | `/dashboard/events/[id]/attendance` — sessions, QR, certificates | Organizers in scope |
| 17 | [`17-membership-cycles.md`](./17-membership-cycles.md) | `/dashboard/membership/cycles` | Leader, admin |
| 18 | [`18-membership-applications.md`](./18-membership-applications.md) | `/dashboard/membership/applications` | Membership reviewers |
| 19 | [`19-members-management.md`](./19-members-management.md) | `/dashboard/members`, `/[id]` | Leader, admin, founders (read) |
| 20 | [`20-committees-management.md`](./20-committees-management.md) | `/dashboard/committees`, `/[id]` | Leader, admin, committee heads |
| 21 | [`21-articles.md`](./21-articles.md) | `/dashboard/articles`, `/new`, `/[id]` | Committee roles, leader |
| 22 | [`22-reports.md`](./22-reports.md) | `/dashboard/reports`, `/committees/[id]` | Founders, leader, advisor, heads |
| 23 | [`23-admin-users-roles.md`](./23-admin-users-roles.md) | `/dashboard/admin/users`, `/roles` | System admin, leader (limited) |
| 24 | [`24-admin-audit-emails-settings.md`](./24-admin-audit-emails-settings.md) | `/dashboard/admin/audit`, `/emails`, `/reference-data`, `/settings` | System admin, leader (limited) |
| 25 | [`25-join-page.md`](./25-join-page.md) | `/join` (new public page) | Everyone |

### Flows and hand-off

| # | File | Contents |
| - | ---- | -------- |
| 80 | [`80-user-flows.md`](./80-user-flows.md) | End-to-end flows across roles (mermaid + step tables) |
| 90 | [`90-claude-design-prompt.md`](./90-claude-design-prompt.md) | Ready-to-paste design brief |

## 4. Design-system anchors

Every screen consumes the SDC design system — nothing new is invented:

- **Tokens** — semantic colors, type scale, spacing, radii, elevation, motion: [`../foundations/`](../foundations/colors.md). Dark: canvas `#050D09`, surface `#0D0E12`, signal accent `#00E676`. Light: canvas `#F4FAF6`, surface `#FFFFFF`, forest text `#123B35`, accent text `#0B8F55` (use a darker step for small text — contrast note in colors §3).
- **Components** — target primitives in [`../components.md`](../components.md) Part 2 (Button, Badge, Card, Field, Dialog, Drawer, Table, Tabs, Skeleton, EmptyState, StatCard, Stepper).
- **Patterns** — [`../patterns.md`](../patterns.md) §6 dashboard, §7 forms, §8 states.
- **Accessibility** — [`../accessibility.md`](../accessibility.md).
- **Typography** — IBM Plex Sans Arabic / Rubik; numbers, ids and dates use `tabular-nums`; English names, emails, URLs stay `dir="ltr"` inside RTL rows.

## 5. Cross-references (source of truth)

| Concern | Doc |
| ------- | --- |
| Roles, permissions, scope | [authorization model](../../06-security/authorization-model.md), [permission catalog](../../06-security/permission-catalog.md) |
| Lifecycles | [event](../../03-business-domain/event-lifecycle.md), [registration](../../03-business-domain/registration-lifecycle.md), [membership](../../03-business-domain/membership-lifecycle.md), [article](../../03-business-domain/article-lifecycle.md) |
| Entities | [05-database/entities](../../05-database/entity-model.md) |
| Requirements | [functional requirements](../../02-requirements/functional-requirements.md) |
| Modules | [11-modules](../../11-modules/README.md) |
| Reference shell | KFUCS `src/components/layout/Sidebar.tsx`, `src/config/sidebarConfig.ts`, `src/components/dashboard/DashboardSkeleton.tsx` ([98-reference](../../98-reference/reference-projects.md#2-kfucs-portal)) |

> Screens depending on unanswered questions show the **recommended default** and name the question (e.g., *Q-005*). If the answer differs, only the gated actions change — not the layout.
