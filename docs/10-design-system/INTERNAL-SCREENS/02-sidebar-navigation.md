# Internal Shell — Sidebar Navigation (Permission-Driven)

> **Update 2026-10-02 (owner request):** the personal pages — *My profile*, *My positions* and *Security* — live in the **profile menu** (the avatar dropdown in the private header), not in the sidebar. The sidebar shows *Overview* (people with a position) or *My account* (plain users), then the Committee / Management / Administration groups. Items whose screens are not built yet are hidden until their sprint, so the menu never links to a 404. A system admin holds all 30 permissions and therefore sees every built Management and Administration item.

Groups and items of the internal sidebar, each bound to a permission key from the [permission catalog](../../06-security/permission-catalog.md). Unlike KFUCS (one hardcoded item list per role — the drift its audit F-53 warned about), SDC builds the sidebar from **one item list filtered by the user's permissions**.

---

## 1. Blueprint — the full tree (what a system admin sees)

```
┌────────────────────────────────┐
│  ⟨SDC⟩ المجتمع السعودي للمطورين │
│        لوحة التحكم               │
│                                │
│  عام                           │
│   ▫ نظرة عامة                   │  /dashboard
│                                │
│  حسابي                         │
│   ▫ تسجيلاتي في الفعاليات        │  /account/registrations
│   ▫ عضويتي                      │  /account/membership
│   ▫ ملفي الشخصي                 │  /account/profile
│                                │
│  اللجنة            [الذكاء ▾]   │  ← committee switcher (only if ≥2 scoped committees)
│   ▫ فعاليات اللجنة          2   │  /dashboard/events?committee=…
│   ▫ التسجيلات               5   │  /dashboard/registrations?committee=…
│   ▫ مقالات اللجنة              │  /dashboard/articles?committee=…
│   ▫ أعضاء اللجنة               │  /dashboard/committees/[id]
│   ▫ تقرير اللجنة               │  /dashboard/reports/committees/[id]
│                                │
│  الإدارة                       │
│   ▾ الفعاليات                   │
│      ▫ جميع الفعاليات            │  /dashboard/events
│      ▫ بانتظار الاعتماد      3   │  /dashboard/events?status=pending_review
│   ▾ العضوية                     │
│      ▫ دورات الاستقبال           │  /dashboard/membership/cycles
│      ▫ طلبات العضوية        41   │  /dashboard/membership/applications
│   ▫ الأعضاء                     │  /dashboard/members
│   ▫ اللجان                      │  /dashboard/committees
│   ▫ المقالات                    │  /dashboard/articles
│   ▫ التقارير                    │  /dashboard/reports
│                                │
│  إدارة النظام                   │
│   ▫ المستخدمون                  │  /dashboard/admin/users
│   ▫ الأدوار والمناصب            │  /dashboard/admin/roles
│   ▫ سجل التدقيق                 │  /dashboard/admin/audit
│   ▫ سجل البريد                  │  /dashboard/admin/emails
│   ▫ القوائم المرجعية            │  /dashboard/admin/reference-data
│   ▫ إعدادات الموقع              │  /dashboard/admin/settings
│                                │
│  ────────────────────────────  │
│   ↗ الموقع العام                │
└────────────────────────────────┘
```

## 2. What each role sees (default permission matrix)

```
Plain user           Committee member (AI)   Committee head (AI)     Community leader          Founder / Advisor
──────────────       ─────────────────────   ─────────────────────   ──────────────────────    ──────────────────
عام                  عام                      عام                      عام                        عام
 ▫ نظرة عامة          ▫ نظرة عامة               ▫ نظرة عامة               ▫ نظرة عامة                 ▫ نظرة عامة
حسابي                حسابي                    حسابي                    حسابي                      حسابي
 ▫ تسجيلاتي           ▫ …                      ▫ …                      ▫ …                        ▫ …
 ▫ عضويتي            اللجنة                    اللجنة                   الإدارة                     الإدارة
 ▫ ملفي               ▫ فعاليات اللجنة          ▫ فعاليات اللجنة          ▾ الفعاليات (+ اعتماد)       ▫ الأعضاء (قراءة)
                      ▫ مقالات اللجنة           ▫ التسجيلات               ▾ العضوية                   ▫ اللجان (قراءة)
                                                ▫ مقالات اللجنة           ▫ الأعضاء                   ▫ التقارير
                                                ▫ أعضاء اللجنة            ▫ اللجان
                                                ▫ تقرير اللجنة            ▫ المقالات
                                                                         ▫ التقارير
                                                                        إدارة النظام (محدود)
                                                                         ▫ الأدوار والمناصب
                                                                         ▫ القوائم المرجعية
                                                                         ▫ إعدادات الموقع
```

## 3. Item → permission binding

| Group | Item (ar / en) | Route | Visible when | Badge |
| ----- | -------------- | ----- | ------------ | ----- |
| عام / General | نظرة عامة / Overview | `/dashboard` | signed in | — |
| حسابي / My account | تسجيلاتي / My registrations | `/account/registrations` | signed in | — |
| | عضويتي / My membership | `/account/membership` | signed in | warning dot when an application decision is new |
| | ملفي الشخصي / My profile | `/account/profile` | signed in | — |
| اللجنة / Committee *(per scope)* | فعاليات اللجنة / Committee events | `/dashboard/events?committee={id}` | `events.view_drafts` in scope | drafts with changes requested |
| | التسجيلات / Registrations | `/dashboard/registrations?committee={id}` | `registrations.review` in scope | pending registrations |
| | مقالات اللجنة / Committee articles | `/dashboard/articles?committee={id}` | `articles.create` in scope | — |
| | أعضاء اللجنة / Committee members | `/dashboard/committees/{id}` | `committee_members.manage` in scope | — |
| | تقرير اللجنة / Committee report | `/dashboard/reports/committees/{id}` | `reports.view_committee` in scope | — |
| الإدارة / Management | الفعاليات ▸ جميع الفعاليات / All events | `/dashboard/events` | `events.view_drafts` **global** | — |
| | الفعاليات ▸ بانتظار الاعتماد / Pending approval | `/dashboard/events?status=pending_review` | `events.approve` | pending count (warning) |
| | العضوية ▸ دورات الاستقبال / Intake cycles | `/dashboard/membership/cycles` | `membership.manage_cycles` | "open" accent dot while a cycle is open |
| | العضوية ▸ طلبات العضوية / Applications | `/dashboard/membership/applications` | `membership.review` | undecided count |
| | الأعضاء / Members | `/dashboard/members` | `members.view` | — |
| | اللجان / Committees | `/dashboard/committees` | `committees.manage` or `roles.view` | — |
| | المقالات / Articles | `/dashboard/articles` | `articles.publish` **global** | in-review count |
| | التقارير / Reports | `/dashboard/reports` | `reports.view_community` | — |
| إدارة النظام / Administration | المستخدمون / Users | `/dashboard/admin/users` | `users.view` | — |
| | الأدوار والمناصب / Roles & positions | `/dashboard/admin/roles` | `roles.view` | — |
| | سجل التدقيق / Audit log | `/dashboard/admin/audit` | `audit.view` | — |
| | سجل البريد / Email log | `/dashboard/admin/emails` | `email_logs.view` | failed count (danger) |
| | القوائم المرجعية / Reference data | `/dashboard/admin/reference-data` | `reference_data.manage` | — |
| | إعدادات الموقع / Site settings | `/dashboard/admin/settings` | `settings.manage` | — |

A user holding a permission **globally** sees the *Management* item and not a duplicate *Committee* item for the same screen.

## 4. Layout rules

- **Group labels** — 11px/700, `--color-text-secondary`, padding-inline 16px, 24px top spacing; Latin labels may be uppercase, Arabic never.
- **Item** — 44px min height, 12px radius, icon 18px (lucide: `LayoutDashboard`, `Ticket`, `IdCard`, `UserRound`, `CalendarDays`, `ClipboardCheck`, `FileText`, `Users`, `Building2`, `BarChart3`, `ShieldCheck`, `ScrollText`, `Mail`, `ListTree`, `Settings`), label 14px/500.
- **Hover** — background `--color-accent-soft` at 50%, text `--color-text`.
- **Active** — background `--color-accent-soft`, text and icon `--color-accent`, weight 600, and a **4×24px indicator bar** at the inline-start edge (KFUCS pattern). A child route (`/dashboard/events/[id]/registrations`) keeps the parent item active and its group expanded.
- **Collapsible parents** (▾ Events, ▾ Membership) — chevron rotates 180°; open state persisted in `localStorage` (`sdc_sidebar_open`), with the active parent always open.
- **Committee switcher** — appears in the *Committee* group header only when the user has scoped permissions in ≥ 2 committees; a compact `Select` listing those committees; selection stored in the URL (`?committee=`) and remembered in a cookie. With one committee, the header simply shows its name.
- **Badges** — capsule at the inline-end, `tabular-nums`, warning tone for "awaiting you", danger for failures, neutral otherwise. **Hidden at zero and while loading** (no skeleton chips in the sidebar). Count ≥ 100 shows "99+".
- **Collapsed rail (768–1023px)** — icons only; tooltip with label on hover/focus; parents open a flyout; badges collapse into a dot.
- **Keyboard** — sidebar is a `nav` landmark with `aria-label="التنقل الداخلي / Internal navigation"`; items are links; parents are buttons with `aria-expanded`; active item has `aria-current="page"`.

## 5. Configuration (implementation contract)

One typed list, filtered on the server:

```ts
// src/config/dashboard-nav.ts — design contract, not yet implemented
type NavItem = {
  key: string;                       // i18n key: nav.<key>
  href: string | ((scope: { committeeId?: string }) => string);
  icon: LucideIcon;
  requires?: { permission: PermissionKey; scope: 'any' | 'global' | 'committee' }; // undefined = any signed-in user
  badge?: QueueKey;                  // e.g. 'events.pendingApproval'
  children?: NavItem[];
};
type NavGroup = { key: 'general' | 'account' | 'committee' | 'management' | 'admin'; items: NavItem[] };

// visibleNav(access) removes items whose `requires` fails, then removes empty parents and empty groups.
```

## 6. States

- **Loading** — none: the sidebar renders from the server-computed access context. Badges stream in later.
- **Permission change during a session** — the next navigation re-renders the shell with the new access context (no stale menu beyond the current page).
- **Empty group** — never rendered.
