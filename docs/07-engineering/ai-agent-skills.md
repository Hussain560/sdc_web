# AI Agent Skills

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Decision**     | D-009 (visual identity frozen) |

The project ships a small set of agent skills from the open skills ecosystem ([skills.sh](https://skills.sh/)). Claude Code, Copilot, Gemini CLI and similar agents load them when relevant. They were found with `find-skills` on 2026-10-02 and chosen by install count and source reputation. Each one was read before installation: they are instruction files only, with no scripts.

## 1. Installed skills

| Skill | Source | Installs (2026-10-02) | Use it for |
| ----- | ------ | --------------------- | ---------- |
| `find-skills` | vercel-labs/skills | — | Discovering further skills (`npx skills find <query>`) |
| `frontend-design` | anthropics/skills (official) | 944K | Layout, hierarchy, typography *rhythm* and restraint when building new screens — **within the frozen identity (§2)** |
| `web-design-guidelines` | vercel-labs/agent-skills (official) | 688K | Reviewing UI code against the Web Interface Guidelines (focus, forms, motion, RTL, touch targets). Fetches the rules from GitHub at review time |
| `vercel-react-best-practices` | vercel-labs/agent-skills (official) | 762K | React 19 / Next.js 16 performance and correctness rules (waterfalls, bundle size, Server Components) |
| `supabase` | supabase/agent-skills (official) | 303K | Supabase Auth, RLS, migrations, SSR client usage |
| `accessibility` | addyosmani/web-quality-skills | 58K | WCAG 2.2 AA checks and patterns ([accessibility](../10-design-system/accessibility.md)) |

The files live in `.agents/skills/` (committed) and are pinned by hash in `skills-lock.json`. `.claude/skills/` holds machine-local symlinks, which are git-ignored.

Restore or update on a new machine:

```bash
npx skills add vercel-labs/skills --skill find-skills -y
npx skills add anthropics/skills --skill frontend-design -y
npx skills add vercel-labs/agent-skills --skill web-design-guidelines --skill vercel-react-best-practices -y
npx skills add supabase/agent-skills --skill supabase -y
npx skills add addyosmani/web-quality-skills --skill accessibility -y
```

## 2. Design guardrail — the identity is frozen (D-009)

> **Public pages (2026-10-10):** [ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md) replaces this guardrail for public pages with Design System v2: use its tokens, components and page specs ([PUBLIC-SCREENS-V2](../10-design-system/PUBLIC-SCREENS-V2/README.md)) and never invent new colours outside `primitives.css`. The table below still applies to the **dashboard**.

`frontend-design` is written for designers creating a *new* identity, so by default it encourages bold, distinctive palettes and typefaces. SDC already has an identity ([design system §2](../10-design-system/README.md#2-character)). The skill itself says that the brief's own words always win, and this is SDC's brief:

| Frozen — never change | Free to improve |
| --------------------- | --------------- |
| Colors: every value in [colors](../10-design-system/foundations/colors.md) (neon green `#00E676` signal on the green-tinted night canvas; the mint/forest light theme) | Spacing consistency, alignment, grid, density |
| Typefaces: IBM Plex Sans Arabic + Rubik ([typography](../10-design-system/foundations/typography.md)) | Type scale *usage* (which step goes where), line length |
| Shapes: capsule buttons, 16–20px card radii, thin green-tinted borders, green glow on hover ([layout and shape](../10-design-system/foundations/layout-and-shape.md)) | Empty, loading (skeleton) and error states |
| Dark default; light as a full peer ([theming](../10-design-system/foundations/theming.md)) | Accessibility: contrast within the palette, focus rings, keyboard, reduced motion |
| Logo, hero art and illustration style | Responsive behaviour and RTL correctness |
| **Public pages stay visually unchanged until a redesign is explicitly approved** | Internal dashboard screens, which are built from the [INTERNAL-SCREENS](../10-design-system/INTERNAL-SCREENS/README.md) blueprints and use the same tokens |

Rules for agents and contributors:
1. Use **semantic tokens** only (`--color-accent`, `--color-surface`…); never introduce a new hex value, gradient or font.
2. If a design skill suggests a palette, typeface or "signature" visual change, **don't apply it**. Write it up as a proposal in [open questions](../90-decisions/open-questions.md) instead.
3. Before merging UI work, run `web-design-guidelines` and `accessibility` on the changed files, and attach light and dark screenshots in Arabic and English to the PR ([DoD](../99-project-management/definition-of-done.md)).
4. For a public page, the PR must also include a before/after visual comparison showing no unintended change.

## 3. Adding a skill

1. Search: `npx skills find <topic>`.
2. Prefer official sources (`anthropics`, `vercel-labs`, `supabase`, `microsoft`) and skills with more than 1K installs.
3. Read every file in the skill before installing it. Reject skills that run scripts you have not reviewed.
4. Install with `npx skills add <owner/repo> --skill <name> -y`, then add a row to §1 in the same PR.
