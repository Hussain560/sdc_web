# ADR-014 — Public Redesign on Design System v2 (supersedes D-009 for public pages)

| Field | Value |
| ----- | ----- |
| **Status** | Accepted (owner approved the Design System v2 designs on 2026-10-10) |
| **Date** | 2026-10-10 |
| **Deciders** | Project owner; Design & Identity committee (A-009) |
| **Supersedes** | D-009 **for public pages only**. D-009 still governs the internal dashboard until a separate decision. |
| **Related** | [Design system](../10-design-system/README.md), [token mapping](../10-design-system/token-mapping.md), [ADR-009](./ADR-009-styling-and-design-tokens.md), [ADR-010](./ADR-010-i18n-routing.md), [ADR-013](./ADR-013-accounts-for-members-only.md), Q-041, Q-042, Q-044 |

## Context

D-009 froze the visual identity: palette, fonts and shapes. The owner now wants the public website redesigned on a stronger system. It should take its structure, type scale and rhythm from the reference sites in [`reference-images/tuwaiq/`](../10-design-system/reference-images/tuwaiq/README.md), and it must stay recognisably SDC. The brief is [`CLAUDE-DESIGN-PROMPT-PUBLIC-REDESIGN.md`](../10-design-system/CLAUDE-DESIGN-PROMPT-PUBLIC-REDESIGN.md). It requires this decision before any redesign work is approved.

## Decision

The public pages move to **Design System v2** ([README](../10-design-system/README.md)). Inside the limits below, v2 may change semantic token values, the type scale, spacing, radii, elevation and motion.

1. **Kept unchanged:** the canvas `#050D09`, the signal green `#00E676`, the light mint canvas `#F4FAF6`, the forest text `#123B35`, IBM Plex Sans Arabic and Rubik (no third family on public pages), the SDC mark and wordmark files, dark-first, and capsule buttons.
2. **Refined:** a green-tinted surface ramp replaces the neutral blue-grey surfaces. The muted text is re-tinted green. The type scale gets larger (the display size is about 4× body). Section rhythm, radii and elevation get new scales.
3. **Added:** 11 primitives for the status colours that did not pass WCAG AA in one theme (warning, danger and info, with their soft fills). They are added to `src/styles/primitives.css` using the same `--c-<hex>` naming. No hex appears anywhere else.
4. **Semantic tokens stay global.** The dashboard shares `tokens.css`, so the value changes reach it too. The [token mapping](../10-design-system/token-mapping.md) lists every change and its impact. The owner approves the visual-regression baselines before they are updated.

## Alternatives considered

| Option | Pros | Cons | Why not chosen |
| ------ | ---- | ---- | -------------- |
| Keep D-009, fix layout only | No baseline churn | Can't reach the type scale, rhythm and surfaces the owner asked for | Doesn't meet the request |
| Separate public token set (`[data-surface='public']`) | The dashboard doesn't change at all | Two systems to maintain; components drift | Volunteers maintain this; one system is cheaper |
| New palette | Fresh look | Loses recognition; brand is owned by the committee (A-009) | Out of scope; brand changes are the owner's |

## Consequences

- Positive: one documented system for every public page, AA contrast in both themes, and real light-theme status colours.
- Negative / costs: the visual baselines of every public page change, and some dashboard surfaces change slightly. Sprint plans that cite D-009 (Sprint 01, Sprint 12) need a note.
- Follow-up: Q-041 (master brand kit and SVG wordmark) stays open. The D-009 row in `docs/90-decisions/README.md` points here. [AI agent skills §2](../07-engineering/ai-agent-skills.md) must say the frozen-identity guardrail applies to the dashboard only. Implementation: [Sprints 14–16](../99-project-management/sprints/sprint-14-design-system-v2-foundation/plan.md).
