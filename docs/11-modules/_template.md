# Module — <Name>

| Field            | Value |
| ---------------- | ----- |
| **Last Updated** | YYYY-MM-DD |
| **Status**       | Draft / In Review / Approved |
| **Owner**        | <committee / person> |
| **Phase / Sprints** | <roadmap phase> / <sprint numbers> |
| **Code**         | `src/modules/<module>/` |

> Module documents **link** to requirements (FR-), business rules (BR-), entities and permissions instead of restating them. They add what is module-specific: process, logic, operations, screens, edge cases and tests.

## 1. Purpose and scope
One paragraph on the problem this module solves for SDC, then:

| In scope | Out of scope |
| -------- | ------------ |

## 2. Current state (CURRENT / PROBLEM)
What exists today and what is wrong, with links to the [audit](../01-project/current-system-audit.md).

## 3. Actors and permissions
| Actor | Can | Permission key / ownership rule | Scope |
| ----- | --- | ------------------------------- | ----- |

## 4. Business process
A Mermaid `flowchart` with one `subgraph` per actor (a swimlane), from trigger to outcome.

## 5. Lifecycle
A Mermaid `stateDiagram-v2`, plus a transition table: from → to, who, guard, side effects.

## 6. Key sequences
One Mermaid `sequenceDiagram` per non-trivial operation (UI → Server Action → DB function → notifications).

## 7. Data
A Mermaid `erDiagram` subset and a table of the tables, views and functions this module owns or reads.

## 8. Business logic and validation
| # | Rule | Enforced in (UI / Server Action / DB) | Source (BR-/FR-) |
| - | ---- | ------------------------------------- | ---------------- |

## 9. Routes and screens
| Route | Audience | Purpose | Blueprint |
| ----- | -------- | ------- | --------- |

## 10. Server operations
| Operation | Input (Zod) | Authorization | DB call | Side effects | Error codes |
| --------- | ----------- | ------------- | ------- | ------------ | ----------- |

## 11. Notifications
Template keys sent, with their trigger and recipient.

## 12. Error codes
| Code | When | User message (ar / en) |
| ---- | ---- | ---------------------- |

## 13. Edge cases
A numbered list, each with its expected behaviour.

## 14. Testing
| Level | Scenarios |
| ----- | --------- |
| Unit | |
| pgTAP | |
| E2E | |

## 15. Implementation plan
Sprint mapping, the module folder layout, migration names and the order of work.

## 16. Open questions
Links to Q- ids.
