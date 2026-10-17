# 99 — Project Management

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Living — kept in sync with `develop` |

## Where the project stands

Sprints 00–16 are built and merged into `develop`. That covers the platform (`v1.0.0` scope) and the public redesign on Design System v2 (`v1.1.0` scope). No version is tagged yet: the candidates `v1.0.0-rc.1` and `-rc.2` exist, and the production cutover is an owner action. The current list of open work is on the [action board](./action-board.md).

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
| [sprints/](./sprints/README.md) | Sprint conventions, the sprint roadmap (Sprint 00 → 16) with planned and delivered dates, one plan per sprint, and the template |

Risks are tracked in the [risk register](../01-project/risk-register.md); decisions and open questions in [90-decisions](../90-decisions/README.md).

## Working model

| Aspect | Model |
| ------ | ----- |
| Cadence | Planned as 2-week sprints from 2026-10-11. In practice Sprints 01–13 were delivered between 2026-10-02 and 2026-10-04 and Sprints 14–16 on 2026-10-10 and 2026-10-11, so the planned dates in the sprint roadmap are a forecast, not a record |
| Repositories | `origin` = `Hussain560/sdc_web` and `upstream` = `sdc-saudi/SDC_website`. Every change is a pull request merged on both; the owner pushes and merges ([git workflow](../07-engineering/git-workflow.md)) |
| Planning unit | Vertical slices per module (DB → server → UI → tests → docs) |
| Tracking | Pull requests and the status columns in this folder (backlog, sprint plans, action board); GitHub Issues and a Project board are optional |
| Roles | Product owner (Q-001), tech lead, contributors, reviewers; release owner per release |
| Ceremonies (lightweight) | Planning (start of sprint), async stand-up thread, review/demo (end), short retrospective in the sprint report |
| Audits | Like Noviq, when a sprint reveals a gap, record an audit report under `sprints/reports/` and insert a corrective sprint rather than silently expanding scope |
