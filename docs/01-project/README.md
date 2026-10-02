# 01 — Project Foundation (Transformation Baseline)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Purpose

Records the **starting point** of the transformation: what exists, what is wrong with it, how far it is from the target, and what could go wrong. These documents describe the system as inspected on **2026-10-02** and are not updated as implementation proceeds — progress is tracked in [99-project-management](../99-project-management/README.md). If the baseline is re-audited, add a dated section rather than rewriting history.

## Documents

| Document | Contents |
| -------- | -------- |
| [current-system-audit.md](./current-system-audit.md) | Full inventory of the codebase, database, auth, authorization, Edge Functions, tooling — with evidence |
| [technical-debt.md](./technical-debt.md) | Catalogued debt items (TD-nnn) with severity and the phase that retires them |
| [gap-analysis.md](./gap-analysis.md) | Current vs target per capability |
| [risk-register.md](./risk-register.md) | Project, security, data and delivery risks (R-nnn) with mitigations |

The transformation plan itself is the [roadmap](../99-project-management/roadmap.md).

## Method

The audit was performed by reading every source file in `app/`, `src/`, `supabase/`, the configuration files, and by querying the running local Supabase stack (`supabase_db_sdc_web`) for tables, columns, constraints, indexes, grants, RLS policies, functions, triggers and storage buckets. A production build (`next build`) was run to confirm the current build state. The linked remote Supabase project was **not** inspected (no access was used); its state is an open question (**OPEN Q-025**).
