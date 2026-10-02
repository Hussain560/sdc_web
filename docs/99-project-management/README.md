# 99 — Project Management

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Purpose

How the transformation is planned, executed, tracked and released. Structure adapted from Noviq's project-management module, sized for a volunteer team.

## Documents

| Document | Contents |
| -------- | -------- |
| [**action-board.md**](./action-board.md) | **Start here:** what to do now / next / later, owners, decisions waiting on people |
| [roadmap.md](./roadmap.md) | Phases 0–7: goals, scope, exit criteria, blocking questions, target versions |
| [milestones.md](./milestones.md) | Milestone gates M0–M8 with acceptance criteria |
| [backlog.md](./backlog.md) | Epics and prioritized stories (initial product backlog) |
| [work-breakdown-structure.md](./work-breakdown-structure.md) | Phase → epic → work package decomposition and sizing |
| [definition-of-ready.md](./definition-of-ready.md) | When a story may enter a sprint |
| [definition-of-done.md](./definition-of-done.md) | When a story/PR/release is done |
| [releases/](./releases/README.md) | Release records and template |
| [sprints/](./sprints/README.md) | Sprint conventions, the dated sprint roadmap (Sprint 00 → 13), one plan per sprint, and the template |

Risks are tracked in the [risk register](../01-project/risk-register.md); decisions and open questions in [90-decisions](../90-decisions/README.md).

## Working model

| Aspect | Model |
| ------ | ----- |
| Cadence | 2-week sprints from 2026-10-11 (Sprint 00 is a 1-week closing sprint, 2026-10-04); re-forecast after Sprint 02 |
| Planning unit | Vertical slices per module (DB → server → UI → tests → docs) |
| Tracking | GitHub Issues + a GitHub Project board (columns: Backlog · Ready · In progress · In review · Done); sprint docs in this folder |
| Roles | Product owner (Q-001), tech lead, contributors, reviewers; release owner per release |
| Ceremonies (lightweight) | Planning (start of sprint), async stand-up thread, review/demo (end), short retrospective in the sprint report |
| Audits | Like Noviq, when a sprint reveals a gap, record an audit report under `sprints/reports/` and insert a corrective sprint rather than silently expanding scope |
