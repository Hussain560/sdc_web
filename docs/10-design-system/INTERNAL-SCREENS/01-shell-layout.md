# Internal Shell — L-Frame Layout (Sidebar + Private Header + Content)

The frame every signed-in screen renders inside: `app/[locale]/(internal)/layout.tsx` shared by `/dashboard/**` and `/account/**`. Modelled on the KFUCS portal L-frame (fixed sidebar at the inline-start, sticky header across the content column) and re-skinned with SDC tokens.

---

## 1. Blueprint

### Desktop (≥ 1024px) — Arabic RTL (sidebar on the right)

```
┌───────────────────────────────────────────────────────────────┬──────────────────────────┐
│ ▍ الفعاليات                          [EN] [☀] │ 🔔 3 │ (س) سارة ▾ │  ⟨SDC⟩ المجتمع السعودي   │
│   لجنة الذكاء الاصطناعي · قائدة اللجنة                          │        للمطورين           │
├───────────────────────────────────────────────────────────────┤──────────────────────────┤
│  الرئيسية › لوحة التحكم › الفعاليات                              │  ▫ نظرة عامة              │
│                                                                 │                          │
│  الفعاليات                                  [ + فعالية جديدة ]   │  حسابي                   │
│  إدارة فعاليات لجنتك ومتابعة حالتها                              │  ▫ تسجيلاتي               │
│                                                                 │  ▫ عضويتي                 │
│  ┌───────────────────────────────────────────────────────────┐ │  ▫ ملفي الشخصي            │
│  │                                                           │ │                          │
│  │              PAGE CONTENT (table / form / detail)          │ │  اللجنة  [الذكاء ▾]       │
│  │                                                           │ │ ▌▪ الفعاليات          2   │
│  │                                                           │ │  ▫ التسجيلات          5   │
│  │                                                           │ │  ▫ المقالات               │
│  └───────────────────────────────────────────────────────────┘ │  ▫ أعضاء اللجنة           │
│                                                                 │  ▫ تقرير اللجنة           │
│                                                                 │                          │
│                                                                 │  ─────────────────────── │
│                                                                 │  ↗ الموقع العام          │
└─────────────────────────────────────────────────────────────────┴──────────────────────────┘
```

In English LTR the sidebar sits on the left and everything mirrors.

### Mobile (< 768px)

```
┌──────────────────────────────────────┐
│ ☰   الفعاليات                (س) ▾   │  ← header 64px, sticky
├──────────────────────────────────────┤
│ الرئيسية › الفعاليات                   │
│ [ + فعالية جديدة ]                     │
│ ┌──────────────────────────────────┐ │
│ │ card list (tables collapse into  │ │
│ │ stacked cards)                    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

☰ opens the sidebar as a full-height Drawer from the inline-start, with a scrim.
```

---

## 2. Layout rules

- **Grid** — `grid-template-columns: 272px minmax(0, 1fr)` on ≥ 1024px; the sidebar column is first in DOM order so it lands at the inline-start in both directions. 768–1023px: sidebar collapses to a **72px icon rail** with tooltips/flyouts. < 768px: sidebar becomes a `Drawer`.
- **Heights** — the shell is `min-height: 100dvh`; the sidebar is sticky (`position: sticky; top: 0; height: 100dvh; overflow-y: auto`); the content column scrolls with the page (not an inner scroll container — keeps native scroll, find-in-page and scroll restoration).
- **Sidebar surface** — `--color-surface` (dark `#0D0E12` / light `#FFFFFF`), `border-inline-end: 1px solid var(--color-border)`. Brand block 88px: the theme-aware logo (`Full whiteLogo` / `navbar` assets) + "المجتمع السعودي للمطورين" in 15px/700 + small accent caption "لوحة التحكم / Dashboard".
- **Private header** — height 72px (64 mobile), sticky, `--color-bg` at 85% opacity + `backdrop-filter: blur(12px)`, bottom border `--color-border`.
  - Inline-start: **page title block** — a 4×36px accent bar (`--color-accent`, radius full) + title (h2 token, 1.25rem/800) + one-line context: active **scope** (committee name) and the user's **position** badge for that scope.
  - Inline-end: language toggle (shows target language), theme toggle (`IconButton`, labelled), **review-queue bell** (only if the user has any queue permission; count = items awaiting *their* action; opens a small popover listing queues), user menu (avatar initial on the existing green gradient + name ▾ → My profile · Public site · Sign out).
- **Content** — `max-width: 1280px`, padding-inline 32px (16px mobile), padding-block 24px 48px. Order: `Breadcrumbs` → `PageHeader` (title, description, primary action at the inline-end) → page body.
- **Primary action placement** — one primary button per page, in the `PageHeader` at the inline-end; secondary actions in a kebab or `outline` buttons beside it.
- **Public site link** — bottom of the sidebar: "↗ الموقع العام / Public site" opens `/` in the same tab.
- **Environment ribbon** — non-production environments show a 4px warning-colored strip at the very top + "STAGING" chip in the header (prevents acting on the wrong environment).
- **RTL** — no physical properties; the accent bar, active indicators and drawers all use `inline-start/end`.

---

## 3. States

- **Initial load (server)** — the shell renders on the server with the user's access context, so the **sidebar is never skeletoned**; only the content area shows the route's skeleton ([04-skeleton-loading](./04-skeleton-loading.md)).
- **Client navigation** — sidebar and header persist; only the content swaps to the target route's `loading.tsx` skeleton.
- **Session expired** — middleware redirects to `/login?next=<current path>`; any in-flight Server Action returns `UNAUTHENTICATED` → toast "انتهت الجلسة، يرجى تسجيل الدخول مجددًا" + redirect.
- **Blocked / suspended member** — the shell still renders for account pages; member-only items disappear; a danger `Alert` at the top of `/dashboard` explains the status.
- **No internal permissions** (plain user) — the sidebar shows only *General* and *My account* groups ([02-sidebar](./02-sidebar-navigation.md)).
- **Offline / server error** — route `error.tsx` inside the content area (shell stays), with retry.

---

## 4. Data & permissions

- **Access context** (`getAccessContext()` — server, once per request, cached with React `cache()`): user id, display name, locale, member status, active role assignments with committee scopes, flattened permission set. Shape and rules in [03-conditional-rendering](./03-conditional-rendering.md).
- **Queue counts** for the bell and sidebar badges load in a **separate, non-blocking** Suspense boundary (never delay the shell).
- **Route protection** — middleware/proxy: unauthenticated → `/login?next=`; the `(internal)` layout calls `requireUser()`; each page calls `requirePermission()` for its own key.
