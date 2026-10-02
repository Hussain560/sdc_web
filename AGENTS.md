<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SDC project rules

- `docs/` is the source of truth. Read `docs/README.md` first; screen blueprints are in `docs/10-design-system/INTERNAL-SCREENS/` and `docs/10-design-system/PUBLIC-SCREENS/`.
- **The visual identity is frozen (decision D-009).** Never change colors, fonts, radii or the dark-first theme, even when a design skill (e.g. `frontend-design`) suggests it. Use semantic tokens only; no new hex values. Public pages stay visually unchanged unless a redesign is explicitly approved. See `docs/07-engineering/ai-agent-skills.md`.
- Events follow the KFUCS model and 4-step wizard (ADR-012); authorization uses permission keys from the database, never hardcoded role or email lists (ADR-004).
- Arabic-first and RTL: every UI string exists in Arabic and English; use logical CSS properties.
- Conventional Commits; never commit `.env*` files or secrets.
- Before finishing a change run `npm run check` (format, lint, types, unit tests) and, for anything that touches UI, `npm run e2e`. The Playwright suite is a visual gate over every public page: a diff means the frozen identity (D-009) moved. Never run `npm run e2e:update` unless a redesign was approved.
- Use `Link`/`useRouter` from `@/i18n/navigation` (never `next/link`/`next/navigation` for routing); English URLs live under `/en`. New UI uses the primitives in `src/components/ui` and semantic tokens (`bg-surface`, `text-muted`), never raw hex.
- Do not add `Co-Authored-By` trailers to commits; never push (owner instruction, see `docs/99-project-management/action-board.md`).
