# ADR-009 — Styling: Design Tokens + Tailwind CSS v4, Progressive Migration

| Field | Value |
| ----- | ----- |
| **Status** | Proposed — step 2 done 2026-10-02 (Tailwind v4 configured via `@tailwindcss/postcss`, no visual change); tokens (step 1) and primitives (step 3) pending |
| **Date** | 2026-10-02 |
| **Related** | [Design system](../10-design-system/README.md), TD-040…TD-043 |

## Context
~5,800 lines of global CSS with colliding class names, ~60 hardcoded hex values, light theme via per-class overrides, 8 breakpoints. Tailwind v4 is installed and imported but non-functional (no PostCSS plugin). The visual design is valued and must be preserved. New internal dashboards (tables, forms, dialogs) need to be built quickly and consistently.

## Decision
1. Introduce **design tokens** as CSS custom properties (`src/styles/tokens.css`) with dark/light values — first, independent of styling technology.
2. Configure **Tailwind CSS v4** properly (`@tailwindcss/postcss`) and map its theme (`@theme`) to the same CSS variables, so utilities like `bg-surface text-accent rounded-xl` resolve to tokens and switch with `data-theme`.
3. Build `components/ui` primitives with Tailwind + tokens (accessible behaviour from Radix primitives where needed).
4. **Progressive migration**: legacy page CSS stays until the page is rewritten; no new global classes; each rewritten page deletes its legacy CSS file.

## Alternatives considered
| Option | Pros | Cons |
| ------ | ---- | ---- |
| CSS Modules + tokens | Close to current CSS; scoped | Slower to build many dashboard screens; more files |
| Keep global CSS, add tokens | Least change | Collisions and override sprawl remain |
| CSS-in-JS | Co-location | Runtime cost / RSC friction |

## Consequences
- One token source for both legacy CSS and Tailwind during migration.
- Contributors need Tailwind familiarity (common).
- Temporary coexistence of two styling approaches until Phase 5; tracked in the backlog.
