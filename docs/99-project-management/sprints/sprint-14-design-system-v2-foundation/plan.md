# Sprint 14 — Design System v2: Tokens, Components, Chrome, Auth Layout

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 14 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2027-04-11 (indicative, Q-S2) |
| **End Date**          | 2027-04-24 |
| **Phase / Milestone** | Phase 7 — Public redesign / M9 |
| **Target version**    | contributes to `v1.1.0` |
| **Capacity**          | ~28 SP — planned 27 SP |
| **Team**              | Tech lead + volunteer developers (assigned at sprint planning); owner for approvals |
| **Status**            | ⬜ Planned |

## Sprint Objective

The v2 tokens and components exist in `src/components/ui` and `src/components/layout`, in both themes and both directions, with tests. The new auth route layout replaces the old auth card. Nothing on the other public pages changes visually yet, **except** what the token values touch (owner-approved baselines). Demo: the component gallery page (`/en/_design` in dev only) and the new sign-in page in AR/EN × dark/light.

References: [ADR-014](../../../90-decisions/ADR-014-public-redesign-design-system-v2.md), [token mapping](../../../10-design-system/token-mapping.md), [components](../../../10-design-system/components.md), [patterns](../../../10-design-system/patterns.md), [auth spec](../../../10-design-system/PUBLIC-SCREENS-V2/05-auth.md).

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| RDS-001 | v2 tokens: new primitives, semantic tokens, non-colour tokens, Tailwind theme, contrast check in CI | P0 | 3 | — | ⬜ |
| RDS-002 | Fonts: one stack (Rubik → Plex Sans Arabic) via `next/font`, type scale utilities | P0 | 2 | — | ⬜ |
| RDS-003 | Actions and labels: Button (+LinkButton), IconButton, TextLink, SegmentedToggle, Badge, StatusPill, TagChip, DateChip | P0 | 5 | — | ⬜ |
| RDS-004 | Forms: Field (+Password), Select, Textarea, Checkbox, Radio, Switch, error summary | P0 | 3 | — | ⬜ |
| RDS-005 | Containers and feedback: Card variants, Avatar, Media, Alert, Toast, Dialog (+busy lock, sheet mode), ResultDialog, Progress, EmptyState, Skeleton presets | P0 | 5 | — | ⬜ |
| RDS-006 | In-page navigation: Tabs, Accordion, Breadcrumb, Pagination, Stepper | P1 | 2 | — | ⬜ |
| RDS-007 | Chrome: SiteHeader (floating + mobile sheet), SiteFooter, Logo, LocaleSwitch, ThemeSwitch, skip link | P0 | 4 | — | ⬜ |
| RDS-008 | Auth route layout `(auth)` without header/footer; login, forgot, reset, claim on v2 | P0 | 3 | — | ⬜ |

### Acceptance criteria per story

**RDS-001 — Tokens**
- `primitives.css` gains exactly the 11 primitives listed in [token mapping §1](../../../10-design-system/token-mapping.md#1-primitives-to-add-primitivescss); no existing primitive changes.
- `tokens.css` matches [token mapping §3](../../../10-design-system/token-mapping.md#3-the-new-tokenscss-reference) (colour tokens, both themes, `color-scheme`) and §4 (type, space, radius, elevation, z-index, motion, containers); `@theme inline` exposes every new token.
- A grep check in CI fails on any `#hex` or `rgb(` literal outside `primitives.css` in `src/` and `app/` (legacy CSS files are listed as an allowlist that only shrinks).
- `docs/10-design-system/tools/contrast.py` runs in CI against the values parsed from the two CSS files; every pair passes in both themes.
- `a11y.css` overrides that the new tokens make unnecessary (`.text-warning`, footer greys) are removed.

**RDS-002 — Fonts**
- `next/font/google` loads Rubik (latin, 400–700) and IBM Plex Sans Arabic (arabic, 400–700) once; `--font-sans` = Rubik first. The duplicate `@import` and `<link>` are gone.
- Type utilities `t-display` … `t-badge` with the fluid `clamp()` values and the AR/EN line heights from [typography §2](../../../10-design-system/foundations/typography.md#2-type-scale).
- The dashboard keeps its Inter rule for English.

**RDS-003 … RDS-006 — Components**
- Each component follows its spec (anatomy, variants, states, sizes) and **extends** the existing file named in [components §9](../../../10-design-system/components.md#9-implementation-map); no duplicate primitive is created.
- Logical properties only (Stylelint rule or grep check in CI); directional icons mirror via `.icon-dir`.
- Every interactive component has a 44 px target, a visible `:focus-visible` ring, and the states of [§0.1](../../../10-design-system/components.md#01-the-state-model).
- Unit tests (Vitest + Testing Library) cover props → rendered state, keyboard behaviour (Tabs, Accordion, SegmentedToggle, Dialog Esc and focus return, busy lock), and `aria-*` wiring (Field hint/error, StatusPill text).
- Playwright component gallery snapshots: each component × {ar, en} × {dark, light} × {desktop, 360}. **New** baselines, committed after owner review.
- The +30% string fixture renders every component without overflow or truncated actions.

**RDS-007 — Chrome**
- The header and footer match [00-chrome](../../../10-design-system/PUBLIC-SCREENS-V2/00-chrome.md): a floating bar ≥ 1024, a 56 px bar + bottom sheet below; the active item has `aria-current`; the account menu shows the dashboard entry **only** when the user has a dashboard permission (from `AccessContext`, never an e-mail list).
- The search icon is hidden while `/search` doesn't exist.
- Social links come from public `site_settings`; a placeholder URL (`https://instagram.com`) is treated as missing.
- Not yet mounted on public pages (Sprint 15 switches them), except behind the gallery.

**RDS-008 — Auth layout**
- `app/[locale]/(auth)/layout.tsx` wraps login, forgot-password, reset-password and claim; the public header and footer **don't render** there (Playwright asserts no `header[role=banner] nav`).
- Each page and state of [05-auth §3](../../../10-design-system/PUBLIC-SCREENS-V2/05-auth.md#3-pages-and-their-states) exists; "Apply for membership" links `/join`; `/register` still redirects to `/join`.
- Errors never reveal whether an account exists; `?redirect=` only accepts same-origin paths (existing helper).
- The brand panel is `aria-hidden` and collapses to a 96 px strip below 1024.

## Pull requests (small, reviewed, in this order)

| PR | Content | Stories | Visual change |
| -- | ------- | ------- | ------------- |
| 1 | `primitives.css` + `tokens.css` + Tailwind theme + hex-literal check + contrast check | RDS-001 | Yes: dashboard and public surfaces re-tint → **baseline PR 1b after owner approval** |
| 2 | `next/font` stack + type utilities | RDS-002 | Yes (small) → included in 1b's approval round |
| 3 | Button, IconButton, TextLink, SegmentedToggle | RDS-003 | Gallery only |
| 4 | Badge, StatusPill, TagChip, DateChip | RDS-003 | Gallery only |
| 5 | Field (+Password, error summary), Select, Textarea | RDS-004 | Dashboard forms (owner check) |
| 6 | Checkbox, Radio, Switch | RDS-004 | Gallery |
| 7 | Card variants, Avatar, Media, EmptyState, Skeleton presets | RDS-005 | Gallery |
| 8 | Alert, Toast, Progress | RDS-005 | Gallery |
| 9 | Dialog busy lock + sheet mode, ResultDialog | RDS-005 | Gallery |
| 10 | Tabs, Accordion, Breadcrumb, Pagination, Stepper | RDS-006 | Gallery |
| 11 | Logo, LocaleSwitch, ThemeSwitch, SiteHeader, SiteFooter | RDS-007 | Gallery |
| 12 | `(auth)` layout + the four pages | RDS-008 | Yes: auth pages → baseline approval |

Every PR: CI green (format, lint, typecheck, unit, pgTAP, e2e), screenshots of AR/EN × dark/light in the description, and a reviewer other than the author.

## Visual regression rule

Baselines change in this sprint. **No PR updates `__screenshots__` on its own.** The flow is: the PR's visual job fails with a diff report → the owner reviews the diffs (artifact link in the PR) → a separate PR `chore(visual): approve v2 baselines — <scope>` runs `--update-snapshots` for exactly that scope, with the owner's approval recorded in its description.

## Tests to add

| Test | Kind | Where |
| ---- | ---- | ----- |
| Token contrast pairs | Script in CI | `docs/10-design-system/tools/contrast.py` (reads the CSS) |
| No hex outside primitives | Grep check in CI | `scripts/check-tokens.mjs` |
| Component behaviour (each component) | Vitest + RTL | `tests/unit/ui/*.test.tsx` |
| Dialog: busy lock blocks Esc and close; focus returns to trigger | Vitest + RTL | `tests/unit/ui/dialog.test.tsx` |
| Component gallery snapshots | Playwright | `tests/e2e/design-gallery.spec.ts` |
| Auth layout has no site chrome; each state | Playwright | `tests/e2e/auth-layout.spec.ts`, extend `tests/auth/auth-flows.spec.ts` |
| axe on the gallery and auth pages | Playwright + axe | extend `tests/e2e/a11y.spec.ts` |
| 320 px no horizontal scroll | Playwright | `tests/e2e/reflow.spec.ts` (new, every public route) |

## Dependencies

| Dependency | Source | Status | Resolution |
| ---------- | ------ | ------ | ---------- |
| ADR-014 accepted | Owner | Resolved 2026-10-10 (owner approved the design) | — |
| New baselines approved per scope | Owner | Pending | Per PR 1b, 12 |
| Q-041 transparent light wordmark | Owner | Pending | Existing raster on mint grounds meanwhile |

## Acceptance Criteria (sprint)

- [ ] All stories meet the [Definition of Done](../../definition-of-done.md); CI green.
- [ ] Contrast and hex checks run in CI and pass.
- [ ] Owner approved the token baselines (dashboard + public) and the auth baselines.
- [ ] Demo in AR/EN × dark/light, desktop and 360 px.

## Sprint Review Checklist (demo script)

- [ ] Gallery: every component in both themes and directions; keyboard pass through Tabs, Accordion, Dialog.
- [ ] Sign in as a member; sign-in error; forgot password (always "check your inbox"); reset with an expired link.
- [ ] Show that the header's dashboard entry appears only for a user with a dashboard permission.
- [ ] Release notes lines collected.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Token re-tint surprises dashboard users | Medium | Low | Impact table in token mapping; owner reviews diffs before approval |
| Font swap changes line breaks in Arabic | Medium | Medium | Fixed line heights per token; gallery +30% fixture; review AR snapshots first |
| Component scope creep | Medium | Medium | Only the listed components; anything else waits for a page that needs it |

## References & Specifications

- Design system v2: `docs/10-design-system/README.md` and its files
- ADRs: ADR-009, ADR-010, ADR-013, ADR-014
- Tests: `docs/09-quality/testing-strategy.md`
