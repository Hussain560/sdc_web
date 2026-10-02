# Current System Audit

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Audit date**   | 2026-10-02                                 |
| **Scope**        | `sdc_web` source, configuration, local Supabase stack |
| **Status**       | Draft                                      |

All statements in this document are **CURRENT** or **PROBLEM** unless tagged otherwise. Severity scale: **Critical** (exploitable now / data loss), **High**, **Medium**, **Low**.

---

## 1. Executive summary

SDC Web is a bilingual (Arabic/English) Next.js 14 website with dark/light themes and a polished visual design. Behind the UI, it is a **prototype**:

| Area | Finding | Severity |
| ---- | ------- | -------- |
| Database security | The `members` table can be **modified or deleted by anyone** holding the public anon key (shipped in every browser). `event_registrations` is **readable and updatable by anyone** — all registrants' names and emails can be downloaded and any registration can be "accepted". | **Critical** |
| Email functions | All three Edge Functions run with `verify_jwt = false` and `Access-Control-Allow-Origin: *`. `send-*-email` accepts any recipient and inserts unescaped input into HTML — an **open, SDC-branded email relay** through the community's Gmail account. | **Critical** |
| Authorization | "Committee" access is a hardcoded array of one personal email in `src/data/committeeEmails.js`, checked **only in the browser**. The data it protects is not protected. | **High** |
| Data management | Events and articles are hardcoded in page source, duplicated in 2–4 places with diverging fields. Leadership and committee heads are hardcoded in the members page. | **High** |
| Database discipline | 2 tables, no foreign keys, no unique constraints, no migrations, no link between `members` and `auth.users`. A seed script that **deletes all members** is the only schema definition. | **High** |
| Engineering | Not a Git repository locally. No tests, no CI, ESLint not installed (`npm run lint` cannot run), TypeScript and Tailwind installed but unused/unconfigured. | **High** |
| Architecture | Every page is a Client Component; no server-side data loading, no per-page metadata, no middleware, no server-side auth. | **Medium** |

The **build succeeds** (`next build`, Next.js 14.2.35, 15 routes, ~170 kB first-load JS per page).

---

## 2. Technology inventory

| Concern | Declared (`package.json`) | Installed | Actual usage |
| ------- | ------------------------- | --------- | ------------ |
| Framework | `next ^14.2.0` | 14.2.35 | App Router; all pages `'use client'` |
| UI runtime | `react ^18.3.0` | 18.3.1 | — |
| Language | JavaScript; `typescript 7.0.2` (dev) | installed | **No** `.ts/.tsx` in app, no `tsconfig.json`/`jsconfig.json` (Edge Functions are TS/Deno) |
| Styling | `tailwindcss ^4.3.3`, `postcss`, `autoprefixer` (dev) | installed | `@import "tailwindcss"` in `globals.css` but **no PostCSS config** → utilities are not generated; **no Tailwind classes used**. Styling is ~5,800 lines of plain global CSS + 80 inline `style={{}}` objects |
| Icons | `lucide-react ^1.41.0` | 1.41.0 | Used |
| Backend SDK | `@supabase/supabase-js ^2.114.0` | 2.114.0 | Browser-only singleton client |
| Supabase CLI | `supabase ^2.116.0` (dev) | 2.116.0 | Local stack running in Docker |
| Lint | script `next lint`; `eslint.config.mjs` (flat config importing `eslint-config-next/core-web-vitals` and `/typescript`) | **ESLint and eslint-config-next not installed** | Lint cannot run. The flat config format matches newer Next.js scaffolds, not Next 14. |
| Tests | none | — | none |
| Node | — | v24.16.0 locally, no `.nvmrc`, no `engines` | — |

**PROBLEM** — `AGENTS.md`/`CLAUDE.md` state "This is NOT the Next.js you know… read `node_modules/next/dist/docs/`". That folder does not exist in the installed Next 14.2.35. The file is scaffold boilerplate from a newer Next.js version, suggesting the project was scaffolded on a newer major and pinned back to 14. The Next.js version for the target is decided in [ADR-001](../90-decisions/ADR-001-application-architecture.md).

**PROBLEM** — the directory is **not a Git repository** (`.gitignore` and `.gitattributes` exist, `.git` does not). Version history, authorship and the canonical remote are unknown (**OPEN Q-024**). *Update 2026-10-02:* the canonical remote is `github.com/sdc-saudi/SDC_website` (3 commits, 2026-09-07); the local copy is newer and is now committed on a branch on top of it — see Q-024.

---

## 3. Application structure

### 3.1 Routes

| Route | File | Rendering | Data source | Notes |
| ----- | ---- | --------- | ----------- | ----- |
| `/` | `app/page.js` | Server shell + client sections | Hardcoded | Hero, latest events (first 3 of `allEvents.js`), latest threads (hardcoded list), community sections, members strip (placeholder avatars), partners (12 placeholder logos) |
| `/about` | `app/about/page.js` | Client | Hardcoded | About text, vision, mission |
| `/events` | `app/events/page.js` | Client | **Hardcoded array inside the page** + `event_registrations` | Registration modal |
| `/events/[id]` | `app/events/[id]/page.js` | Client | **Hardcoded `eventsDatabase` object inside the page** + `event_registrations` | Unknown id silently shows **event 2** instead of 404 |
| `/articles` | `app/articles/page.js` | Client | Hardcoded array (metadata only) | Labeled "Threads" |
| `/articles/[id]` | `app/articles/[id]/page.js` | Client | Hardcoded `articlesDatabase` (full bilingual text) | Unknown id silently shows **article 1**; breadcrumb says "Articles" |
| `/members` | `app/members/page.js` | Client | Hardcoded leadership + `members` table | Leadership hierarchy hardcoded; `MEMBER_IDS_SHOWN_ABOVE = [10, 15, 3]` excludes database ids by hand |
| `/members/all` | `app/members/all/page.js` | Server | — | Redirects to `/members` (legacy URL) |
| `/members/[id]` | `app/members/[id]/page.js` | Client | `members` table | Simulated "Contact me" form (fake `setTimeout`, button commented out) |
| `/committee` | `app/committee/page.js` | Client | `event_registrations`, `members`, `allEvents.js` | Registration review dashboard (see §6) |
| `/login` | `app/login/page.js` | Client | Supabase Auth | Ignores the `?redirect=` parameter that other pages pass |
| `/register` | `app/register/page.js` | Client | Supabase Auth | Account sign-up (full name ≥ 3 words, password policy client-side only) |
| `/forgot-password` | `app/forgot-password/page.js` | Client | `check-email-exists` function + Supabase Auth | Reveals whether an email is registered |
| `/reset-password` | `app/reset-password/page.js` | Client | Supabase Auth | Signs the user out after reset |
| 404 | `app/not-found.js` | Client component | — | Arabic only |
| `/search` | — | — | — | **Does not exist**, but the header search navigates there on submit → 404 |

There is **no** `middleware.js`, no Route Handler (`app/api`), no Server Action, no `loading.js`/`error.js`, and no per-page `metadata`/`generateMetadata` (only the root title "Saudi Developer Community").

### 3.2 Shared code

| Path | Purpose | Notes |
| ---- | ------- | ----- |
| `src/lib/supabase.js` | `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` | Single browser client; no server client, no SSR cookie session |
| `src/context/AuthContext.js` | Session state via `getSession()` + `onAuthStateChange`; login, signup, logout, reset, update password | Browser-only auth state |
| `src/context/LanguageContext.js` | `ar`/`en` toggle stored in `localStorage` (`app_lang`); sets `dir`/`lang` on `<html>` after mount; ~70-key dictionary | Most strings are **inline ternaries** (`isEnglish ? … : …`) in pages, not dictionary keys |
| `src/context/ThemeContext.js` | `dark` (default) / `light`, stored as `sdc_theme`; `data-theme` attribute on `<html>`; an inline script in `layout.js` prevents theme flash | Works well; keep the approach |
| `src/context/SearchContext.js` | Global search string used by list pages to filter in-memory | Cleared on navigation |
| `src/components/*` | Header, HeroSection, ArticlesSection (also contains events + registration), CommunitySections, MembersSection, Footer, NotFound, Breadcrumb | `Breadcrumb` is **unused**; every page hand-builds its own breadcrumb |
| `src/data/allEvents.js` | 6 events (summary fields) | Used by home and committee page |
| `src/data/events.json` | 3 different, fictional events | **Unused** (dead) |
| `src/data/articlesData.json` | 7 article titles | **Unused** (dead) |
| `src/data/committeeEmails.js` | `COMMITTEE_EMAILS = ['<one personal email>']` | Authorization "list" (see §6) |

### 3.3 Hardcoded vs database-backed

| Data | Where it lives today | Copies | Database-backed? |
| ---- | -------------------- | ------ | ---------------- |
| Events (summary) | `src/data/allEvents.js`, `app/events/page.js` | 2 identical-ish copies | No |
| Events (detail: responsibilities, requirements, deliverables, benefits, FAQ, audience, prizes, contact) | `app/events/[id]/page.js` | 1 (diverges from summary, e.g., date punctuation) | No |
| Fictional events | `src/data/events.json` | unused | No |
| Articles (list) | `app/articles/page.js`, `src/components/ArticlesSection/ArticlesSection.jsx` | 2 (titles differ: "AI in Games" vs "AI in Gaming") | No |
| Articles (full text) | `app/articles/[id]/page.js` | 1 | No |
| Founders, leader, advisor, committee heads | `app/members/page.js` | 1 | No |
| Community sections | `src/components/CommunitySections/CommunitySections.jsx` | 1 | No |
| Partners | `src/components/MembersSection/MembersSection.jsx` | placeholders | No |
| Committee reviewers | `src/data/committeeEmails.js` | 1 | No |
| Members | `public.members` | — | **Yes** |
| Event registrations | `public.event_registrations` (`event_id` refers to hardcoded ids) | — | **Yes** |
| Accounts | `auth.users` (`user_metadata.full_name`) | — | **Yes** |

---

## 4. Database (local Supabase stack)

Inspected in container `supabase_db_sdc_web` (PostgreSQL 17). The linked remote project ref is recorded in `supabase/.temp/linked-project.json` (project name `sdc-members`); its schema and data were not inspected (**OPEN Q-025**, **Q-026**).

### 4.1 Schema

Only two application tables exist, created by `supabase/seed_tables.sql` (not a migration).

**`public.members`** — `id serial PK`, `first_name`, `last_name`, `first_name_en`, `last_name_en`, `major`, `major_en`, `sub_major`, `sub_major_en`, `status`, `status_en`, `university`, `university_en`, `track`, `track_en` (all `varchar`, nullable), `bio`, `bio_en`, `portfolio_url`, `x_url`, `linkedin_url`, `github_url` (`text`, nullable), `created_at timestamptz default now()`.

**`public.event_registrations`** — `id serial PK`, `user_id uuid` (nullable, **no FK**), `event_id integer NOT NULL` (**no FK** — refers to hardcoded event ids), `full_name varchar(150)`, `email varchar(150)`, `status varchar(50) default 'pending'` (**no CHECK**), `created_at timestamptz default now()`.

| Integrity element | Present? |
| ----------------- | -------- |
| Foreign keys | **None** |
| Unique constraints (besides PK) | **None** — a user can register for the same event many times |
| Check constraints | **None** — `status` accepts any string |
| Indexes (besides PK) | **None** |
| Link `members` ↔ `auth.users` | **None** — a member is a free-standing row; members cannot edit their own profile |
| Functions / triggers | **None** |
| Profiles table | **None** — the user's name exists only in `auth.users.raw_user_meta_data.full_name` |
| Storage buckets (local) | **None** (the remote project has a public `assets` bucket used by emails) |
| Migrations (`supabase/migrations`, `supabase_migrations.schema_migrations`) | **None** |

### 4.2 Row Level Security and grants

RLS is **enabled** on both tables, but every policy is permissive (`USING (true)` / `WITH CHECK (true)`) for role `public` (which includes `anon`). The `anon` and `authenticated` roles hold full table privileges (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER — Supabase defaults, never revoked).

| Table | Policy | Command | Effect | Severity |
| ----- | ------ | ------- | ------ | -------- |
| `members` | Allow read members | SELECT `true` | Public directory read — acceptable only for public columns | — |
| `members` | Allow write members | **ALL** `true` | **Anyone (no login needed) can insert, update or delete any member** via the REST API | **Critical** |
| `event_registrations` | Allow read registrations | SELECT `true` | **Anyone can list every registrant's full name and email** | **Critical** (personal data exposure) |
| `event_registrations` | Allow insert registrations | INSERT `true` | Anyone can insert registrations with any `user_id`, name or email | High |
| `event_registrations` | Allow update registrations | UPDATE `true` | **Anyone can change any registration's status** (e.g., accept themselves) | **Critical** |

The seed script's own comment says these are "open policies for local development". There is no evidence of different policies in the remote project; if the remote was created from this script, **production has the same exposure** (**OPEN Q-025** — urgent).

### 4.3 Seed script hazards

`supabase/seed_tables.sql` contains `DELETE FROM public.members;` and `DELETE FROM public.event_registrations;` followed by sample inserts. Running it against any non-local database **destroys all members and registrations**. It is not wired into `config.toml` as a seed, so it is run manually.

### 4.4 Supabase configuration

`supabase/config.toml` contains only the three `[functions.*]` blocks. All other settings (`project_id`, `[api]`, `[db]`, `[auth]` — site URL, redirect URLs, email confirmations, password policy, rate limits, `[auth.email.smtp]`, `[storage]`, `[inbucket]`) fall back to CLI defaults. Local auth behaviour is therefore **not version-controlled** and may differ from the remote project.

---

## 5. Authentication

| Flow | Implementation | Findings |
| ---- | -------------- | -------- |
| Sign-up | `supabase.auth.signUp({ email, password, options.data.full_name })` from the browser | Full name ≥ 3 words and password complexity (8+ chars, upper, lower, digit, symbol) enforced **only in the browser**; the server-side password policy is CLI default. Detects "already registered" via empty `identities` array. |
| Email confirmation | Supabase default templates; local emails go to Mailpit (port 54324) | Login shows a specific message when the email is not confirmed |
| Sign-in | `signInWithPassword` from the browser | Always navigates to `/` — ignores `?redirect=` |
| Session | `getSession()` + `onAuthStateChange` in a React context; tokens in `localStorage` (supabase-js default) | No server-side session; Server Components cannot know the user |
| Sign-out | `signOut()` | — |
| Password reset | `check-email-exists` Edge Function (service role, scans **all** auth users page by page) → `resetPasswordForEmail(redirectTo /reset-password)` | Account enumeration; O(n) scan per request; unauthenticated |
| Profile | None — name lives in `user_metadata` | Users cannot edit their name; no avatar |
| Authenticated-only routes | `/committee` (client redirect to `/login?redirect=/committee`) | No route protection on the server |

---

## 6. Authorization

| Question | Answer today |
| -------- | ------------ |
| Who can access what? | Visitors: all pages. Signed-in users: event registration. "Committee": users whose email is in `COMMITTEE_EMAILS`. |
| Where are permissions checked? | `Header.jsx` (shows the "لوحة اللجنة" nav link) and `app/committee/page.js` (renders "not authorized") — both in the **browser**. |
| Server-side enforcement? | **None.** The committee page's data queries are ordinary anon-key queries that any visitor can run. |
| Database-level protection? | **None** (see §4.2). |
| Roles stored in the database? | **No.** No roles, permissions or positions exist in the database. |
| Organizational scope? | **None.** The single reviewer sees and acts on every event's registrations. |
| Ownership checks? | **None.** Users read their own registrations by filtering `user_id = me` in the browser, but nothing prevents reading others. |

**Committee dashboard behaviour** (`app/committee/page.js`): loads all registrations and all member names; groups by `event_id`; resolves event titles from `allEvents.js`; labels each registrant **"عضو" (member)** or **"زائر" (visitor)** by comparing the registrant's typed full name to `first_name + last_name` of member rows (fragile: spelling, three-part vs two-part names); Accept/Reject updates `status` directly and invokes `send-status-email` with the registrant's email and the **Arabic** event title, fire-and-forget.

The committee email list also ships a **personal email address in the public JavaScript bundle**.

---

## 7. Edge Functions and email

| Function | Purpose | Auth | Findings |
| -------- | ------- | ---- | -------- |
| `check-email-exists` | Returns `{ exists }` for an email | `verify_jwt = false`, CORS `*` | Service-role key; iterates `auth.admin.listUsers` 1,000 at a time until found → enumeration + cost grows with users; leaks internal error messages |
| `send-registration-email` | "Registration received" email | `verify_jwt = false`, CORS `*` | Sends to **any `to` address** given by the caller; `fullName`/`eventTitle` interpolated into HTML **without escaping** (HTML injection); uses Gmail SMTP (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) via `nodemailer` |
| `send-status-email` | Acceptance / rejection email | Same | Same as above; any caller can send "you are accepted" emails; rejection copy asserts a reason |

Cross-cutting email findings:

- **Open relay**: an attacker can send unlimited branded emails to arbitrary addresses from the community Gmail account — phishing risk and likely Gmail account suspension (Gmail sending limits ≈ 500/day).
- Emails are triggered **from the browser** after the database write; failures are only `console.error`-ed; there is no record of what was sent (no email log), no retry, no idempotency.
- Templates are Arabic-only, inline HTML strings, duplicated across functions, and hardcode the production Supabase project URL for the logo.
- `deno.json` import maps declare `@supabase/functions-js`/`@supabase/server` but the code imports `npm:` specifiers directly; versions differ (`supabase-js@2.45.4` in functions vs 2.114 in the app).

---

## 8. Frontend quality

| Area | Finding |
| ---- | ------- |
| Rendering | All pages are Client Components; content is fetched or hardcoded in the browser. No SSR data, so search engines and link previews see no event/article content beyond the shell. |
| Duplication | Registration flow (state, modal, insert, email) implemented **three times**: `ArticlesSection.jsx`, `app/events/page.js`, `app/events/[id]/page.js`. Modal and card CSS duplicated across files. |
| CSS architecture | Plain global CSS files imported per page; App Router bundles them globally, so identical class names defined in several files collide (e.g., `.sdc-modal-overlay` in 3 files, `.sdc-category-card` 9 definitions, `.sdc-tag-pill` 4). Styling depends on load order. 64 `!important`. 8 different breakpoints. |
| Theming | Light theme implemented as hundreds of `:root[data-theme='light'] .class` overrides with hardcoded hex values (no tokens; only 2 CSS variables exist). |
| i18n | `lang`/`dir` set client-side after mount; server HTML is always `ar`/`rtl` → layout flash for English users; no locale in URL; dictionary covers a minority of strings. 404 page Arabic-only. |
| Accessibility | 10 `aria-*` attributes in the whole app; icon-only buttons (theme, modal close) lack labels; generic `alt="icon"`; modals are not focus-trapped and do not close on Escape; status conveyed by color in places. |
| Images | 20 raw `<img>` tags, no `next/image`; asset file names with spaces; external `via.placeholder.com` fallbacks. |
| Robustness | Event/article detail pages fall back to a different item for unknown ids; `tel:undefined` rendered for events without phone; dates are display strings ("قريبًا سيعلن عنه") so nothing can be sorted or compared; "ended" is decided by comparing a translated label. |
| Dead code | `events.json`, `articlesData.json`, `Breadcrumb.jsx`, contact-me modal, `members/all` route |
| Stale content | Footer "Last updated: 04/12/2020"; copyright hardcoded "© 2026" |
| Fonts | Rubik loaded twice (layout `<link>` and `globals.css @import`); render-blocking Google Fonts CSS instead of `next/font` |

---

## 9. Engineering process

| Practice | State |
| -------- | ----- |
| Version control | Was not a Git repository locally; since 2026-10-02 a branch on top of `sdc-saudi/SDC_website` (Q-024, D-010) |
| Branching / PRs / reviews | Unknown / none observable |
| Commit conventions | Unknown |
| CI/CD | None (`.github/` absent) |
| Tests | None |
| Lint / format / type-check | Lint broken (ESLint missing); no Prettier; no type-checking |
| Versioning | `package.json` `0.1.0`; no tags, no changelog |
| Environments | `.env.local` points to the local stack (`127.0.0.1`); remote project linked; deployment target unknown (**OPEN Q-027**) |
| Secrets | `.env.local` git-ignored (good). Edge Function secrets `GMAIL_USER`, `GMAIL_APP_PASSWORD` configured outside the repo (location unknown) |
| Documentation | Root `README.md` (Arabic, partially broken Markdown, describes components only) |

---

## 10. What is worth keeping

| Asset | Why |
| ----- | --- |
| Visual design and brand feel (dark green-on-black, light mint theme, capsule buttons, card styles) | Distinctive and liked; becomes the basis of the [design system](../10-design-system/README.md) |
| Theme mechanism (`data-theme` + pre-hydration script) | Correct pattern; keep, back it with tokens |
| Bilingual content already written (event details, article texts, about copy) | Becomes seed/migration data |
| Event detail information architecture (responsibilities, requirements, deliverables, benefits, FAQ, sidebar facts) | Validated content model for events |
| Member directory filtering UX (university, major, sub-major, status, track) | Validated needs for the member data model |
| Registration-review concept with acceptance/rejection emails | Validated workflow to formalize |
| Password policy and full-name rule | Move to server-side validation |
| Local Supabase + Mailpit setup | Keep as the local development baseline |

---

## 11. Addendum — platform upgrade (2026-10-02, same day)

At the stakeholder's request, the framework and language migration (Phase 1 items ENG-001…003, ENG-007) was done ahead of the rest of Phase 1. **Behaviour and visuals of public pages are unchanged** — verified by comparing computed styles of every element on 12 pages (+2 in light theme) before and after: the only deltas are ±0.03 px sub-pixel text widths, which also vary between two runs of the old build.

| Item | Before | After |
| ---- | ------ | ----- |
| Next.js / React | 14.2.35 / 18.3.1 | **16.3.8 / 19.3.0** (Turbopack build) |
| Language | JavaScript | **TypeScript 5.9**, `strict` + `noUncheckedIndexedAccess`, 0 errors (`npm run typecheck`) |
| Supabase client | untyped | typed with generated `Database` types (`src/lib/supabase/database.types.ts`, `npm run db:types`); env vars validated at startup |
| Lint | broken (ESLint missing) | ESLint 9 + `eslint-config-next` 16: **0 errors**, 25 warnings (24 `<img>`, 1 custom font — left because fixing them changes public markup) |
| Tailwind | imported, unconfigured | configured via `@tailwindcss/postcss` (preflight identical; no utilities used yet) |
| Contexts | untyped, `useContext` could return undefined | typed; hooks throw outside providers |
| Dead code | `events.json`, `articlesData.json`, `Breadcrumb` | removed |
| Node pin | none | `.nvmrc` = 24, `engines.node >= 20.9` |
| Other deps | — | `@supabase/supabase-js` 2.117, `@supabase/ssr` 0.12 (installed, not yet used), `lucide-react` 1.49, Supabase CLI 2.119; `autoprefixer` removed (built into the Tailwind pipeline) |
| Config | `next.config.mjs` | `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `.env.example` |

Still exactly as before (by design): all security findings in §4–§7 (RLS, Edge Functions, client-side authorization), hardcoded data, client-only rendering. A pre-migration source backup was taken (outside the repository).
