# Documentation Standards

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Rules

| # | Rule |
| - | ---- |
| DS-1 | `docs/` is the source of truth. A behaviour change and its documentation change ship in the **same PR**. |
| DS-2 | Every document starts with a metadata table: at least **Last Updated** and **Status** (Draft / In Review / Approved / Superseded). |
| DS-3 | Never mix **CURRENT**, **PROBLEM**, **TARGET**, **DECISION**, **OPEN Q-nnn**, **ASSUMPTION A-nnn** in one statement (see [docs README](../README.md#how-to-read-these-documents)). |
| DS-4 | One topic, one home. Link instead of repeating. |
| DS-5 | Specific to SDC. No generic filler, no invented rules — unknowns become open questions. |
| DS-6 | Language: English, with Arabic terms where the domain uses them (glossary). User-facing copy examples in both languages. |
| DS-7 | Diagrams as Mermaid in Markdown (versionable). Images only when Mermaid cannot express it. |
| DS-8 | File names `kebab-case.md`; folders numbered as in the [directory map](../README.md#directory-map). |
| DS-9 | IDs are stable and never reused: FR-*, NFR-*, BR-*, Q-*, A-*, D-*, ADR-*, TD-*, R-*. |
| DS-10 | Approved documents change through PRs reviewed by the document owner. |

## 2. Architecture Decision Records

Use an ADR for a decision that is **architecturally significant**: hard to reverse, affects several modules, introduces/removes a technology, or changes a security/data boundary. Do **not** write ADRs for routine choices (a library for date formatting, a CSS value).

- Location: `docs/90-decisions/ADR-NNN-kebab-title.md`, using the [template](../90-decisions/_template.md).
- Status lifecycle: **Proposed** → **Accepted** / **Rejected** → (later) **Superseded by ADR-MMM**.
- Accepted ADRs are not edited for substance; a new ADR supersedes them.
- Smaller decisions (business or process) go to the **decision log** (`D-nnn`) in [90-decisions/README.md](../90-decisions/README.md).

## 3. Open questions and assumptions

- New unknowns are added to [open-questions.md](../90-decisions/open-questions.md) with priority, owner and what is blocked.
- When answered: record the answer and date, convert it into a decision (D-nnn) or ADR, update affected documents, and mark the question **Answered** (never delete it).

## 4. Module documentation

Each module folder in [11-modules](../11-modules/README.md) follows the module template. Module docs **link** to requirements, rules and entities rather than restating them, and add module-specific content: screens, flows, edge cases, test scenarios.

## 5. Review cadence

- At each milestone: review [risk register](../01-project/risk-register.md), [open questions](../90-decisions/open-questions.md), and document statuses.
- After each sprint: sprint report and any documentation drift found during the sprint.
