# 02 — Requirements

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Documents

| Document | Contents |
| -------- | -------- |
| [functional-requirements.md](./functional-requirements.md) | What the system must do, per module (FR-*) |
| [non-functional-requirements.md](./non-functional-requirements.md) | Quality attributes: security, privacy, performance, accessibility, i18n, reliability, maintainability, operations, cost (NFR-*) |

## Identifier scheme

`FR-<AREA>-<nnn>` and `NFR-<AREA>-<nnn>`. Numbers are never reused; withdrawn requirements are marked **Withdrawn**, not deleted.

| Area | Module |
| ---- | ------ |
| PUB | Public site (home, about, leadership, partners, search) |
| AUTH | Accounts and authentication |
| MBR | Membership intake (cycles, applications) |
| MEM | Members and member directory |
| CMT | Committees and positions |
| EVT | Events |
| REG | Event registrations and attendance |
| ART | Articles / threads |
| NOT | Notifications |
| RPT | Reports and statistics |
| ADM | Administration |

## Priority (MoSCoW)

| Priority | Meaning |
| -------- | ------- |
| **M** — Must | Required for the target platform to replace the current one (v1.0.0) |
| **S** — Should | Important; planned, may slip one phase |
| **C** — Could | Desirable if capacity allows |
| **W** — Won't (now) | Explicitly deferred |

## Traceability

Each requirement links to the business rules (BR-*) it implements and the roadmap phase that delivers it. Tests reference requirement ids in their names (see [testing strategy](../09-quality/testing-strategy.md)). Requirements that depend on an unanswered question are marked with the question id and must not enter a sprint until it is answered (see [Definition of Ready](../99-project-management/definition-of-ready.md)).
