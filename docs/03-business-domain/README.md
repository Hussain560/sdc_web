# 03 — Business Domain

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Purpose

Defines SDC's **organizational and business reality** in implementation-neutral terms: who the actors are, how the community is structured, what the core entities are, which states they move through, and which rules govern them. The database model ([05-database](../05-database/README.md)) and the authorization model ([06-security](../06-security/authorization-model.md)) are derived from this section — not the other way around.

## Status of rules in this section

Every rule carries a **Source** and a **Status**:

| Status | Meaning |
| ------ | ------- |
| **Confirmed** | Stated by a stakeholder (DECISION) or observable as intended behaviour in the current product |
| **Proposed** | Recommended by this foundation; needs stakeholder approval (linked to an OPEN question) |
| **Assumed** | Temporary working assumption (ASSUMPTION A-nnn) |

Proposed rules are written so they can be accepted or changed without restructuring the model.

## Documents

| Document | Contents |
| -------- | -------- |
| [domain-model.md](./domain-model.md) | Conceptual entities, relationships and domain areas |
| [organizational-structure.md](./organizational-structure.md) | Leadership, positions, terms, hierarchy; comparison with KFUCS |
| [committee-model.md](./committee-model.md) | What a committee is, its responsibilities, membership and lifecycle |
| [membership-lifecycle.md](./membership-lifecycle.md) | Account vs member, **membership intake cycles (join page that opens ≈ once a year)**, applications, member status |
| [event-lifecycle.md](./event-lifecycle.md) | Event authoring, review, publishing, timing phases, cancellation, completion |
| [registration-lifecycle.md](./registration-lifecycle.md) | Event registration, review, waitlist, cancellation, attendance |
| [article-lifecycle.md](./article-lifecycle.md) | Article/thread authoring, review, publishing, archiving |
| [notification-rules.md](./notification-rules.md) | Which events trigger which messages, to whom, in which language |
| [reporting-model.md](./reporting-model.md) | Metrics, definitions and who may see them |
| [business-rules.md](./business-rules.md) | Consolidated catalogue of all rules (BR-*) |
