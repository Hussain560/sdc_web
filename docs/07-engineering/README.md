# 07 — Engineering Standards

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Purpose

Professional engineering discipline sized for a volunteer, non-profit team. Adapted from the Innosoft standards (Version Control, Version Control Tags, Deployment Standards Gate, API Conventions, TS/JS configuration) with enterprise elements removed where they add cost without value for SDC (see [98-reference](../98-reference/reference-projects.md#3-innosoft-engineering-standards)).

## Documents

| Document | Contents |
| -------- | -------- |
| [git-workflow.md](./git-workflow.md) | Branches, Conventional Commits, pull requests, code review, branch protection, hotfixes |
| [versioning-and-releases.md](./versioning-and-releases.md) | SemVer, tags, changelog, release notes, release process, version plan |
| [coding-standards.md](./coding-standards.md) | TypeScript, React/Next.js patterns, naming, styling, i18n, errors, lint/format, dependencies |
| [ai-agent-skills.md](./ai-agent-skills.md) | Installed agent skills (design, React, Supabase, accessibility) and the frozen-identity guardrail (D-009) |
| [documentation-standards.md](./documentation-standards.md) | How docs are written, maintained, and reviewed; ADR process |

Related: [Definition of Ready](../99-project-management/definition-of-ready.md) · [Definition of Done](../99-project-management/definition-of-done.md) · [CI/CD](../08-infrastructure/ci-cd.md) · [Testing strategy](../09-quality/testing-strategy.md)

## Engineering policy on AI coding agents

The Innosoft policy forbids AI agents on *government* projects; it does not apply to SDC. For SDC: AI-assisted changes are allowed but follow exactly the same rules as human changes — a human opens/owns the PR, CI must pass, and a human reviewer approves. **Proposed** (**OPEN Q-043**).
