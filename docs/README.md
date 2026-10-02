# SDC Platform Documentation — Source of Truth

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Project**      | Saudi Developer Community (SDC) — منصة المجتمع السعودي للمطورين |
| **Repository**   | `sdc_web` (Next.js + Supabase)                          |
| **Doc set version** | 0.1.0 (Phase 0 — Discovery & Foundation)             |
| **Last Updated** | 2026-10-02                                              |
| **Status**       | Draft — awaiting stakeholder review                     |

## Purpose

This directory is the **single source of truth** for the SDC platform: what the product is, how the community is organized, what the system must do, how it is built, how it is secured, and how work on it is planned, reviewed and released.

Code that contradicts an **Approved** document is a defect in either the code or the document — raise it, do not silently diverge.

## How to read these documents

Every statement in this documentation belongs to exactly one of the following categories. They are never mixed in the same sentence or table row.

| Tag | Meaning | Where it comes from |
| --- | ------- | ------------------- |
| **CURRENT** | What exists in the codebase / database **today** | Direct inspection of `sdc_web` and the local Supabase stack (2026-10-02) |
| **PROBLEM** | What is wrong, fragile, insecure, duplicated or missing | Analysis of CURRENT |
| **TARGET** | What the system should become | Requirements + architecture design |
| **DECISION** | Something explicitly decided (by stakeholders or by an accepted ADR) | [Decision log](./90-decisions/README.md) |
| **OPEN Q-nnn** | A question that needs an owner's answer before the related work can be finalized | [Open questions](./90-decisions/open-questions.md) |
| **ASSUMPTION A-nnn** | A temporary working assumption used because information is missing | [Open questions § Assumptions](./90-decisions/open-questions.md#5-assumptions) |

Document status values: **Draft** (written, not reviewed) → **In Review** → **Approved** (binding) → **Superseded**.

## Source-of-truth precedence

When sources conflict:

| Question being answered | Authoritative source |
| ----------------------- | -------------------- |
| What does the system do today? | The SDC codebase and database (not old docs, not memory) |
| What should the system do? | SDC stakeholder decisions and the requirements in this directory |
| How should docs / project management be structured? | Noviq documentation (methodology only) |
| How should organizational RBAC and event workflows be shaped? | KFUCS Portal (reference only, redesigned for SDC) |
| How should Git, versioning, reviews and quality gates work? | Innosoft engineering standards (adapted to SDC scale) |

No reference project is authoritative over SDC's own requirements. See [98-reference](./98-reference/README.md) for what was borrowed and what was explicitly rejected.

## Directory map

```text
docs/
├── README.md                     ← you are here
├── 00-product/                   Identity: what SDC is, who it serves, scope, principles, glossary, brand
├── 01-project/                   Transformation baseline: current-system audit, technical debt, gaps, risks
├── 02-requirements/              Functional (FR-*) and non-functional (NFR-*) requirements
├── 03-business-domain/           Organization, roles, membership intake, lifecycles, business rules
├── 04-architecture/              Current vs target architecture, frontend, server logic, email
├── 05-database/                  Current schema, conventions, target entity model, RLS, migrations
├── 06-security/                  Security model, authentication, authorization (RBAC + scope), privacy, audit
├── 07-engineering/               Git workflow, commits, PRs, versioning & releases, coding & doc standards
├── 08-infrastructure/            Environments, env vars & secrets, local dev, deployment, CI/CD, operations
├── 09-quality/                   Testing strategy, manual QA & regression checklist
├── 10-design-system/             Foundations (color, type, spacing, theming, RTL), components, patterns, a11y,
│                                 INTERNAL-SCREENS/ (dashboard blueprints, conditional rendering, skeletons, flows)
│                                 PUBLIC-SCREENS/ (current public pages, frozen look, target states, visitor flows)
├── 11-modules/                   One folder per functional module (purpose, actors, rules, data, UI, tests)
├── 90-decisions/                 ADRs, decision log, open questions & assumptions
├── 98-reference/                 What was taken from Noviq / KFUCS / Innosoft and why
└── 99-project-management/        Roadmap, milestones, backlog, WBS, DoR, DoD, releases, sprints
```

## Where to start

| You are… | Read in this order |
| -------- | ------------------ |
| New to the project | [Product overview](./00-product/product-overview.md) → [Current-system audit](./01-project/current-system-audit.md) → [Target architecture](./04-architecture/target-architecture.md) |
| Answering stakeholder questions | [Open questions](./90-decisions/open-questions.md) → [Organizational structure](./03-business-domain/organizational-structure.md) |
| Designing a feature | [Requirements](./02-requirements/README.md) → [Business rules](./03-business-domain/business-rules.md) → the module in [11-modules](./11-modules/README.md) |
| Touching the database | [Database README](./05-database/README.md) → [RLS model](./05-database/rls-security-model.md) → [Migration strategy](./05-database/migration-strategy.md) |
| Opening a pull request | [Git workflow](./07-engineering/git-workflow.md) → [Definition of Done](./99-project-management/definition-of-done.md) |
| Building UI | [Design system](./10-design-system/README.md) → [Internal screens](./10-design-system/INTERNAL-SCREENS/README.md) / [Public screens](./10-design-system/PUBLIC-SCREENS/README.md) → [AI agent skills](./07-engineering/ai-agent-skills.md) |
| Planning work | [**Action board**](./99-project-management/action-board.md) → [Roadmap](./99-project-management/roadmap.md) → [Backlog](./99-project-management/backlog.md) → [Sprints](./99-project-management/sprints/README.md) |

## Current phase

**Phase 0 — Discovery & Foundation.** Besides this `docs/` directory, one approved application change was made: the framework/language upgrade (Next.js 16, React 19, TypeScript) with no behaviour or visual change — see [audit §11](./01-project/current-system-audit.md#11-addendum--platform-upgrade-2026-10-02-same-day). Implementation begins only after the foundation is reviewed and the blocking open questions are answered — see [Roadmap § Phase 0 exit criteria](./99-project-management/roadmap.md#phase-0--discovery--foundation).
