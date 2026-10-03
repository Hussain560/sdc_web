# Frontend Architecture

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Principles

1. **Server Components by default.** A component becomes a Client Component only for interaction (forms, modals, filters, toggles) — and then as small as possible.
2. **Pages read; actions write.** Pages fetch through module query functions; mutations go through Server Actions in the owning module.
3. **One implementation per UI concern.** One `EventCard`, one `RegistrationButton`, one `Modal` (current code has three registration flows).
4. **Design-system primitives only.** Pages compose primitives from `components/ui`; no page-local copies of buttons, modals, badges.

## 2. Routing (target)

Locale handling per [ADR-010](../90-decisions/ADR-010-i18n-routing.md) (Proposed: `[locale]` segment, Arabic default without prefix, English under `/en`).

```text
app/
├── [locale]/
│   ├── layout.tsx                    html lang/dir, fonts, theme script, providers
│   ├── (public)/
│   │   ├── page.tsx                  home
│   │   ├── about/page.tsx
│   │   ├── events/page.tsx           list (upcoming / past filters)
│   │   ├── events/[slug]/page.tsx    detail (+ registration island)
│   │   ├── articles/page.tsx
│   │   ├── articles/[slug]/page.tsx
│   │   ├── members/page.tsx          leadership + directory
│   │   ├── members/[id]/page.tsx
│   │   ├── committees/[slug]/page.tsx
│   │   └── join/page.tsx             membership intake (cycle state + form)
│   ├── (auth)/
│   │   ├── login/ · register/ · forgot-password/ · reset-password/
│   │   └── auth/callback/route.ts    code exchange for email links
│   ├── account/                      signed-in user: profile, registrations, membership
│   └── dashboard/                    internal; layout checks session + any dashboard permission
│       ├── page.tsx                  role-aware overview
│       ├── events/ (list, new, [id]/edit, [id]/registrations, [id]/attendance)
│       ├── articles/
│       ├── membership/cycles/ · membership/applications/
│       ├── members/
│       ├── committees/
│       ├── reports/
│       └── admin/ (users, roles, audit, settings)
├── api/
│   ├── webhooks/email/route.ts       provider delivery events (optional)
│   └── cron/[job]/route.ts           protected by CRON_SECRET
└── not-found.tsx
```

Legacy routes: `/events/[id]` (numeric) and `/articles/[id]` redirect permanently to the slug URLs; `/members/all` → `/members`; `/committee` → `/dashboard/events`.

## 3. Internationalization

| Aspect | Target |
| ------ | ------ |
| Locale source | URL segment (ADR-010); fallback cookie/`Accept-Language` only for the first redirect |
| `lang` / `dir` | Set in the `[locale]` layout on the server — fixes the current client-side flash |
| UI strings | Message catalogues `messages/ar.json`, `messages/en.json` (namespaced by module); no inline `isEnglish ? … : …` |
| Content | Bilingual DB columns (`*_ar`, `*_en`); helper `localized(row, 'title', locale)` with Arabic fallback |
| Dates | `Intl.DateTimeFormat(locale, { timeZone: 'Asia/Riyadh' })` via one helper |
| Direction-aware styling | CSS logical properties; icons that imply direction (arrows, chevrons) flip via `dir` |
| Library | `next-intl` (used successfully in the KFUCS reference) — Proposed in ADR-010 |

## 4. Theming

Keep the current mechanism (it works): `data-theme="dark|light"` on `<html>`, set before paint by an inline script reading `localStorage('sdc_theme')`, default **dark**. Replace per-class light overrides with **semantic CSS variables** that change under `[data-theme='light']` ([theming](../10-design-system/foundations/theming.md)).

## 5. Data fetching and caching

| Page type | Strategy |
| --------- | -------- |
| Public content (events, articles, leadership, directory) | Static rendering with revalidation **by tag** when content changes (Server Actions call `revalidateTag('events')` etc.); time-based fallback revalidation (e.g., 1 h) for derived timing badges |
| Event detail with personal registration state | Static page shell + small server-rendered or client island for "my registration" (per-user, uncached) |
| Account and dashboard | Dynamic (per request, user session), no shared cache |
| Reports | Dynamic; heavy aggregates via SQL views/functions |

Timing badges (coming soon / open / ended) are computed at render; with time-based revalidation they are at most one revalidation interval stale, and registration guards are enforced in the database regardless.

## 6. State management

No global client state library. State lives in: the URL (filters, pagination, locale), server data (RSC), form state (React `useActionState` / form libraries), and two tiny client contexts (theme, toasts). The current `SearchContext` (global search string shared across pages) is replaced by URL search params per list page.

## 7. Forms

- Zod schema per form in the module (`modules/<m>/schemas.ts`), used for client hints and server validation.
- Server Actions return `{ ok, data } | { ok: false, code, fieldErrors }`; the form shows field errors in the active language.
- Submit buttons show pending state; double-submit prevented.
- Destructive actions use a confirm dialog that names the object being changed.

## 8. Project structure (target)

```text
src/
├── app/                      routes only (thin): compose modules + components
├── modules/
│   └── <module>/             access · events · registrations · membership · members ·
│       ├── queries.ts        committees · articles · notifications · reports · admin
│       ├── actions.ts        ('use server')
│       ├── schemas.ts        (zod)
│       ├── types.ts
│       └── components/       module-specific UI (EventCard, RegistrationButton…)
├── components/
│   ├── ui/                   design-system primitives (Button, Card, Badge, Modal, Input…)
│   └── layout/               Header, Footer, DashboardShell, Breadcrumbs
├── lib/
│   ├── supabase/             server.ts · browser.ts · proxy.ts · admin.ts (server-only)
│   ├── auth/                 session.ts · permissions.ts (can(), requirePermission())
│   ├── i18n/                 config, request, formatters
│   ├── email/                provider.ts · templates/ · send.ts
│   ├── errors.ts · logger.ts · env.ts (validated env)
├── styles/                   tokens.css · globals.css
└── messages/                 ar.json · en.json
```

Rules: `app/` must not import `lib/supabase/admin.ts` directly; `components/ui` must not import from `modules`; modules may import `components/ui` and `lib`. Enforced by ESLint import rules.
