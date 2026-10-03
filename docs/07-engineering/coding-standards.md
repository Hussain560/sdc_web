# Coding Standards

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Language and toolchain

| Item | Standard |
| ---- | -------- |
| Language | TypeScript **5.9** (pinned `~5.9.3` until `typescript-eslint` supports TS 7), `strict: true`, `noUncheckedIndexedAccess: true` ([ADR-008](../90-decisions/ADR-008-typescript-adoption.md)). All app code is `.ts/.tsx` (converted 2026-10-02); `allowJs` is off. |
| Node.js | `.nvmrc` = 24 (LTS); `engines.node >= 20.9.0` (Next.js 16 minimum). CI uses `.nvmrc`. |
| Package manager | npm with committed `package-lock.json`; `npm ci` in CI. |
| Lint | ESLint flat config: `eslint-config-next` (core-web-vitals + typescript), import ordering/boundaries, `jsx-a11y`; zero warnings policy in CI. |
| Format | Prettier (`printWidth 100`, single quotes, trailing commas) + `eslint-config-prettier`. |
| Pre-commit | Husky + lint-staged: format + lint staged files (Innosoft TS/JS standard) — Git now exists; added in Sprint 01 (ENG-009). |
| Type checking | `tsc --noEmit` in CI. |

Key rules (adapted from the Innosoft TS/JS standard): no `any` (`@typescript-eslint/no-explicit-any: error`), no unused variables, no non-null assertions without comment, `no-console` (use `lib/logger`), `no-eval`, `no-var`, exhaustive `switch` on union types.

## 2. Naming

| Thing | Convention | Example |
| ----- | ---------- | ------- |
| Components | `PascalCase` file and export | `EventCard.tsx` |
| Hooks | `useCamelCase` | `useDirection` |
| Other modules | `kebab-case.ts` | `date-format.ts` |
| Variables/functions | `camelCase`; booleans `is/has/can/should` | `isRegistrationOpen` |
| Types/interfaces | `PascalCase`, no `I` prefix | `Registration` |
| Constants | `UPPER_SNAKE_CASE` only for true constants | `MAX_BIO_LENGTH` |
| Server Actions | verb-first, `Action` suffix not used | `registerForEvent` |
| Permission keys | `resource.action` | `events.approve` |
| Routes | lowercase, hyphenated, plural collections ([Innosoft URL routing](../98-reference/reference-projects.md)) | `/dashboard/membership/cycles` |
| CSS classes (legacy) | `sdc-` prefix until migrated | — |

## 3. React and Next.js

| Rule | Detail |
| ---- | ------ |
| Server first | Components are Server Components unless they need state, effects, browser APIs or event handlers. `'use client'` at the smallest boundary. |
| Data reads | Through `modules/*/queries.ts` from Server Components; never `useEffect` + fetch for initial data. |
| Mutations | Server Actions in `modules/*/actions.ts` following the [action skeleton](../04-architecture/server-logic-and-data-access.md#3-module-anatomy). |
| Secrets | Modules using secrets/service role start with `import 'server-only'`. |
| Not found | `notFound()` for missing/unauthorized resources — never fall back to another record. |
| Metadata | Every page exports `generateMetadata` (localized title, description, OG). |
| Images | `next/image` with explicit sizes; assets named in `kebab-case` without spaces. |
| Fonts | `next/font` (IBM Plex Sans Arabic, Rubik). |
| Links | `next/link`; external links `rel="noopener noreferrer"`. |
| Lists | Stable keys (ids), never array index for dynamic lists. |
| Forms | Zod schema shared client/server; accessible labels; pending and error states. |
| No duplication | A UI flow exists once (e.g., one `RegistrationButton`). |

## 4. Styling

Per [ADR-009](../90-decisions/ADR-009-styling-and-design-tokens.md) (Proposed):

- Colors, spacing, radii, shadows, motion **only through design tokens** (CSS variables) — no raw hex in components.
- New/refactored UI uses the design-system primitives and the chosen styling approach; no new global class names; no inline `style={{}}` except dynamic values (e.g., computed widths).
- Logical properties for direction (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`).
- No `!important` (existing ones removed when touched).
- Breakpoints only from the token scale.

## 5. Internationalization

- Every user-facing string comes from `messages/{ar,en}.json` (`t('events.register')`), including errors and emails.
- Message keys: `module.screen.element` (`registrations.dialog.confirm`).
- Bilingual DB content via the `localized()` helper (Arabic fallback).
- Dates via the shared formatter (Asia/Riyadh, locale-aware) — never hand-formatted strings.
- Neutral, formal Arabic per [voice and tone](../00-product/brand/voice-and-tone.md).

## 6. Error handling and logging

- Server code returns `Result<T>` objects for expected failures; throws only for unexpected ones (caught by error boundaries).
- Map database errors with the shared mapper ([error handling](../04-architecture/server-logic-and-data-access.md#5-error-handling)).
- Log with `lib/logger` (structured); never log secrets or other people's personal data.

## 7. API conventions (Route Handlers)

Following the Innosoft API conventions where Route Handlers exist: nouns, plural, lowercase-hyphenated paths; HTTP verbs for actions; `page`/`size` pagination; query parameters for filters; standard status codes (200/201/204/400/401/403/404/500); JSON body `{ success, code, message, data }`. Locale via the URL locale or `Accept-Language` (the Innosoft `lang` header convention is unnecessary for same-origin calls).

## 8. Dependencies

- Prefer the platform (Next.js, Supabase, Web APIs) over new libraries.
- A new runtime dependency needs a PR note: purpose, alternatives, size, maintenance status, license.
- Approved baseline (Proposed): `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `next-intl`, `lucide-react`, a sanitizing Markdown renderer, Radix UI primitives for accessible dialogs/menus, React Email (or equivalent) for templates, Vitest, Playwright, Testing Library.
- Dependabot weekly; patch/minor updates batched; majors planned.

## 9. Comments and code hygiene

- Comment *why*, not *what*. Reference rule ids where a rule is enforced (`// BR-REG-002`).
- Comments in English (code) — user-facing Arabic lives in message catalogues.
- No commented-out code, no dead files (the current `events.json`, `articlesData.json`, `Breadcrumb.jsx` are removed in Phase 1).
- `TODO` must reference an issue: `// TODO(#123): …`.
