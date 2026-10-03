# Risk Register

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft — review at every milestone |

Likelihood / Impact: **L**ow, **M**edium, **H**igh. Status: Open, Mitigating, Closed.

| ID | Risk | Category | L | I | Mitigation | Owner | Status |
| -- | ---- | -------- | - | - | ---------- | ----- | ------ |
| R-001 | Production database has the same open RLS policies as local → member data defaced/deleted, registrant emails harvested | Security / Data | H | H | Inspect remote immediately (Q-025); if confirmed, apply a minimal containment migration (drop write policies, restrict registration reads) before any other work — see [roadmap § containment](../99-project-management/roadmap.md#phase-0-containment-track) | Tech lead | Open |
| R-002 | Email functions abused as an open relay → spam/phishing in SDC's name; Gmail account suspended; reputation harm | Security / Reputation | M | H | Containment: require JWT and server-side recipient resolution, or disable functions until redesign; rotate Gmail app password | Tech lead | Open |
| R-003 | Existing production data (members, registrations) lost or corrupted during migration to new schema | Data | M | H | Full backup before every migration; data-migration scripts tested on a copy; reversible steps; row-count reconciliation | Tech lead | Open |
| R-004 | Business rules remain undecided (open questions) and implementation stalls or guesses | Delivery | H | M | Prioritized [open questions](../90-decisions/open-questions.md) with owners; blocking questions gate phases; documented assumptions with review dates | Product owner | Open |
| R-005 | Volunteer availability / turnover leaves work half-finished | Delivery | H | M | Small vertical slices per sprint; documentation-first; DoD requires docs updated; no long-lived branches | Project lead | Open |
| R-006 | Free-tier limits hit (Supabase project pausing after inactivity, egress, email daily caps) | Operations | M | M | Monitor usage ([operations](../08-infrastructure/operations.md)); keep-alive via scheduled health check; email batching; budget request path (Q-017) | Tech lead | Open |
| R-007 | Canonical repository unknown → work diverges across copies | Process | M | H | Establish the GitHub repository and branch protection in Phase 0 (Q-024) | Tech lead | Open |
| R-008 | Rewrite scope creep — rebuilding UI while redesigning data and auth | Delivery | M | M | Preserve existing visuals; change data/auth layers first; UI refactors only where touched | Tech lead | Open |
| R-009 | Over-engineering for scale that does not exist | Architecture | M | M | Principles PP-4; ADR required for any new infrastructure component | Tech lead | Open |
| R-010 | Personal-data handling not compliant with Saudi PDPL expectations | Legal / Privacy | M | H | Data inventory, minimum collection, privacy notice and consent on forms, retention rules ([privacy](../06-security/data-protection-and-privacy.md)); seek guidance (Q-031) | Product owner | Open |
| R-011 | RBAC model too complex for volunteers to administer | Usability | M | M | Small fixed role catalogue; positions map to roles 1:1; admin UI shows positions, not raw permissions | Tech lead | Open |
| R-012 | Next.js major upgrade breaks existing pages | Technical | M | L | Upgrade early (Phase 1) while pages are simple; build + smoke E2E as gate | Tech lead | Open |
| R-013 | Single person holds all admin knowledge/credentials (Supabase, Vercel, email, domain) | Operations | H | H | At least two system administrators; credentials in a shared password manager; access documented in [environments](../08-infrastructure/environments.md) | Project lead | Open |
| R-014 | Hardcoded public leadership names become stale or wrong (e.g., after term changes) | Content | H | L | Leadership view generated from time-bound role assignments (Phase 2–3) | Committee heads | Open |
