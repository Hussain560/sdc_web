# Skeleton Loading System

Every internal route has a skeleton that matches its final layout, shown instantly while data streams. Adopts the KFUCS "pure skeleton" approach (shell always visible, content area swaps between skeleton and data) and the existing SDC shimmer (`.sdc-skel`, 1.4 s).

---

## 1. Primitives (`components/ui/skeleton`)

| Primitive | Geometry | Use |
| --------- | -------- | --- |
| `Skeleton.Line` | height = text line-height of the token it replaces (e.g., body 16/27px → 12px bar inside a 27px row), width prop (%, ch) | Text |
| `Skeleton.Title` | h2/h3 height, 40–60% width | Page/card titles |
| `Skeleton.Circle` | size prop (default 40) | Avatars, icons |
| `Skeleton.Pill` | 22×64px, radius full | Badges, chips |
| `Skeleton.Button` | 40×120px, radius full | Actions |
| `Skeleton.Block` | width × height, radius `--radius-md` | Images, charts, inputs |
| `Skeleton.Card` | Card shell (surface, border, radius-xl, padding) containing children | Containers |
| `Skeleton.StatTile` | Card 112px: label line 40%, value 28px × 30%, icon circle at inline-end | KPI tiles |
| `Skeleton.Table` | header row + N rows × M columns; column widths prop | Tables |
| `Skeleton.Form` | N label+input pairs (label 12px × 25%, input 44px block) | Forms |
| `Skeleton.Timeline` | N nodes (circle 16 + 2 lines) on a horizontal rail | Lifecycle timeline |

Visual: base `--color-surface-field`; shimmer gradient from `rgba(255,255,255,0.05)` → `0.10` → `0.05` (dark) and `#EAF6EE` → `#F4FAF6` (light); 1.4 s ease infinite, moving in the reading direction (right→left in RTL).

## 2. Anatomy per screen type

### 2.1 List page (events, applications, members, articles)

```
┌──────────────────────────────────────────────────────────────┐
│ ▬▬▬▬▬ › ▬▬▬▬▬ › ▬▬▬▬                                           │  breadcrumbs
│ ███████████████                         (▬▬▬▬▬▬▬▬▬)            │  title + primary button
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬                                         │  description
│ (▬▬▬ 12) (▬▬▬ 3) (▬▬▬ 8) (▬▬▬ 1)                               │  status tabs as pills
│ [▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬]  [▬▬▬▬▬▬ ▾] [▬▬▬▬▬ ▾]                      │  search + filters
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ▬▬▬▬▬▬▬     ▬▬▬▬▬▬      ▬▬▬▬     ▬▬▬▬▬    ▬▬▬            │ │  header
│ │ ◯ ▬▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬     ▬▬▬▬     (▬▬▬)    ▬▬             │ │  ×8 rows
│ │ ◯ ▬▬▬▬▬▬▬   ▬▬▬▬▬       ▬▬▬▬▬    (▬▬▬▬)   ▬▬             │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Detail page (event, member, committee)

Header (title 50%, status pill, 2 action buttons) → timeline (5 nodes) → two columns: **rail** (Card with 6 label/value pairs) + **main** (tabs as 3 pills + Table 4 rows).

### 2.3 Dashboard overview

Welcome card (circle 56 + 2 lines) → 4 `StatTile`s → two columns: queue card (Table 4 rows) + upcoming card (3 list rows).

### 2.4 Form page / drawer

Section title + `Skeleton.Form` (fields matching the real form count) → sticky footer with two `Skeleton.Button`s. Drawers open immediately with the skeleton inside (never a blank drawer).

### 2.5 Reports

Period selector pill → 4 `StatTile`s → 2 `Skeleton.Block` charts (16:9) → Table 5 rows.

## 3. Rules

| # | Rule |
| - | ---- |
| SK-1 | **Same geometry** as the loaded UI (same grid, columns, card sizes) so nothing jumps when data arrives (CLS ≈ 0). |
| SK-2 | Skeletons come from the route's `loading.tsx` (navigation) or a `<Suspense fallback>` around slow sections (e.g., charts, counts). Fast sections render immediately; don't skeleton the whole page for one slow widget. |
| SK-3 | **No spinners** for page/section loading. A spinner is allowed only *inside a button* while its action runs (with the label kept for width). |
| SK-4 | Row counts: tables 8, cards 6, lists 3–5 — never one giant block. |
| SK-5 | The **shell (sidebar + header) is never skeletoned** — it renders from the server access context. Sidebar badges are simply absent until loaded. |
| SK-6 | Accessibility: the region being loaded has `aria-busy="true"`; one visually hidden live text "جارٍ التحميل… / Loading…"; skeleton elements are `aria-hidden`. |
| SK-7 | `prefers-reduced-motion: reduce` → static skeleton (no shimmer). |
| SK-8 | Mutations do not re-skeleton the page: keep data visible, show the button's pending state, then update (and `revalidatePath`). |
| SK-9 | Re-fetch on filter change: keep the previous rows visible at 60% opacity with `aria-busy` (via `useTransition`) instead of flashing a skeleton. |
| SK-10 | Empty results are **not** a loading state: once loaded, show `EmptyState` (icon, title, description, action). |

## 4. Empty and error states (companions)

| State | Pattern |
| ----- | ------- |
| Empty list (no data at all) | Icon + "لا توجد فعاليات بعد / No events yet" + primary action if permitted ("+ فعالية جديدة") |
| Empty after filters | "لا توجد نتائج مطابقة / No matching results" + *Reset filters* |
| Section error | Inline `Alert` (danger) inside the card + *Retry*; the rest of the page stays usable |
| Page error | `error.tsx` inside the shell: title, short message, error code, *Retry*, *Back to dashboard* |
