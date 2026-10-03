# Sprint NN — <Name>

> Copy this folder to `sprints/sprint-NN-<slug>/` and replace every placeholder.

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | NN |
| **Duration**        | 2 weeks |
| **Start Date**      | YYYY-MM-DD |
| **End Date**        | YYYY-MM-DD |
| **Phase / Milestone** | Phase X — <name> / M# |
| **Target version**  | vX.Y.Z (or "contributes to") |
| **Capacity**        | XX story points (based on last two sprints' velocity) |
| **Team**            | <names and roles> |
| **Status**          | ⬜ Planned / 🔄 In progress / ✅ Complete |

## Sprint Objective

<2–4 sentences: what will be true at the end of the sprint, why it matters, which current-system problem (TD-/R- ids) it retires, and what will be demoed.>

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| XXX-001 | | P0 | 3 | | ⬜ |

## Technical Tasks

1. **<Task title>** — <what, where (files/tables/functions), how it is verified>.
2. **Migration `<timestamp>_<name>.sql`** — tables/columns, constraints, indexes, RLS, grants, comments.
3. **pgTAP** — policy matrix rows and transition tests for …
4. **Server module** — `modules/<m>/{schemas,queries,actions}.ts` …
5. **UI** — routes/components, both locales and themes …
6. **Tests** — unit/integration/E2E journeys …
7. **Docs** — module/entity/rule documents to update …

## Dependencies

| Dependency | Source | Status | Resolution |
| ---------- | ------ | ------ | ---------- |
| <e.g., Q-005 answered> | Open question | Pending / Resolved | <who, by when> |

## Acceptance Criteria

- [ ] <Given/When/Then, including at least one authorization-denied case>
- [ ] CI green; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Demo: <scenario as role A>
- [ ] Demo: <same scenario denied for role B>
- [ ] Demo: Arabic RTL and English LTR, dark and light
- [ ] Code review completed — all PRs merged to `develop`
- [ ] Release notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |

## References & Specifications

- Requirements: FR-…
- Business rules: BR-…
- Entities: `docs/05-database/entities/…`
- Module doc: `docs/11-modules/…`
- ADRs: …

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
