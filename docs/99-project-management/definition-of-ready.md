# Definition of Ready (DoR)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

A story may enter a sprint only when **all** applicable items are true. The tech lead checks readiness during planning; non-ready stories stay in the backlog.

## Business clarity
- [ ] Written as a user story ("As a … I want … so that …") or a clear technical task with purpose
- [ ] Linked requirement ids (FR-/NFR-) and business rule ids (BR-)
- [ ] **No blocking open question** — every linked Q-nnn is answered, or the story is explicitly scoped to the documented default with the product owner's agreement
- [ ] Acceptance criteria written (Given/When/Then), 2–8 items, including at least one authorization/negative case

## Design
- [ ] Screens identified; wireframe or reference to an existing pattern ([patterns](../10-design-system/patterns.md))
- [ ] Arabic and English copy available (or keys defined with draft copy)
- [ ] States considered: loading, empty, error, permission denied

## Technical clarity
- [ ] Data changes identified (tables, columns, constraints, RLS, functions) and consistent with [05-database](../05-database/README.md)
- [ ] Permission keys identified ([permission catalog](../06-security/permission-catalog.md))
- [ ] Notifications identified (template keys)
- [ ] Migration impact on existing data understood (expand/contract)

## Size and dependencies
- [ ] Estimated; ≤ 8 story points
- [ ] Dependencies on other stories resolved or scheduled earlier in the same sprint
- [ ] Test approach noted (pgTAP / unit / integration / E2E)
