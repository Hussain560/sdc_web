# 05 — Database

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Purpose

The database is the **authoritative source for all dynamic application data** and the **primary enforcement point** for integrity and row-level authorization. Static JS/JSON files must not substitute for data that needs management, relationships, permissions or lifecycle tracking.

Platform: Supabase PostgreSQL 17 (local: Supabase CLI in Docker; hosted: Supabase).

## Documents

| Document | Contents |
| -------- | -------- |
| [current-schema.md](./current-schema.md) | Exact as-is schema (2 tables) and its problems |
| [conventions.md](./conventions.md) | Naming, types, keys, status columns, audit columns, indexing, soft-delete |
| [entity-model.md](./entity-model.md) | Target ERD and table inventory |
| [entities/identity-and-access.md](./entities/identity-and-access.md) | `profiles`, `roles`, `permissions`, `role_permissions`, `role_assignments` |
| [entities/organization.md](./entities/organization.md) | `committees` |
| [entities/membership.md](./entities/membership.md) | `membership_cycles`, `membership_applications`, `members` |
| [entities/reference-data.md](./entities/reference-data.md) | `universities`, `majors`, `tracks`, `event_types`*, `tags` |
| [entities/events.md](./entities/events.md) | `events`, `event_private_details`, `event_registrations` |
| [entities/content.md](./entities/content.md) | `articles`, `article_authors`, `article_tags` |
| [entities/platform.md](./entities/platform.md) | `audit_logs`, `email_logs`, `site_settings` |
| [rls-security-model.md](./rls-security-model.md) | Helper functions, policy matrix, grants, RLS testing |
| [migration-strategy.md](./migration-strategy.md) | Migration workflow, environment promotion, legacy data and content migration |

## Design status

The target model is **Proposed**. Parts depending on open questions are flagged in each entity document. The model is designed so that likely answers change columns or seed data, not structure.
