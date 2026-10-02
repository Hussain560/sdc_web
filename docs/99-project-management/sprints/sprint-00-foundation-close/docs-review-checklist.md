# Documentation Review Checklist (FND-001)

| Field            | Value                                           |
| ---------------- | ----------------------------------------------- |
| **Last Updated** | 2026-10-02                                      |
| **Status**       | Ready for the project owner and tech lead       |
| **Time needed**  | About 3 hours in total, can be split in 3 parts |

How to review: read the file, then mark it **In Review** (you have comments) or **Approved** in its metadata table. Anything you disagree with becomes a comment on the pull request or a line in [open questions](../../../90-decisions/open-questions.md). You do not need to read all 180+ files; this list is the minimum that decides the direction.

## Part 1 — Product and decisions (≈ 1 h, project owner)

| # | Read | Decide |
| - | ---- | ------ |
| 1 | [Product overview](../../../00-product/product-overview.md) | Is this the community we are building? |
| 2 | [Business processes](../../../03-business-domain/business-processes.md) | Do the yearly intake, event journey and handover match reality? |
| 3 | [Decision log](../../../90-decisions/README.md) (D-001 … D-010) | Any decision to reverse? |
| 4 | [Open questions](../../../90-decisions/open-questions.md), P1 items | Answer them in the leadership session |
| 5 | [Roadmap](../../roadmap.md) and [milestones](../../milestones.md) | Are the dates and phase order acceptable? |

## Part 2 — Screens (≈ 1 h, project owner and a designer if available)

| # | Read | Check |
| - | ---- | ----- |
| 6 | [Public screens](../../../10-design-system/PUBLIC-SCREENS/README.md) | The look is frozen; confirm nothing is missing |
| 7 | [Internal screens](../../../10-design-system/INTERNAL-SCREENS/README.md), in particular the [event form (13)](../../../10-design-system/INTERNAL-SCREENS/13-event-form.md) and [attendance (16)](../../../10-design-system/INTERNAL-SCREENS/16-event-attendance.md) | Do they match the KFUCS behaviour you want? |
| 8 | [Sidebar and role-based visibility](../../../10-design-system/INTERNAL-SCREENS/README.md) | Who sees which menu item? |

## Part 3 — Engineering (≈ 1 h, tech lead)

| # | Read | Check |
| - | ---- | ----- |
| 9 | [ADR-012 events](../../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md) and the [module specs](../../../11-modules/README.md) | Rules, error codes and sprint assignment |
| 10 | [Security model](../../../06-security/security-model.md) and [access control module](../../../11-modules/access-control/README.md) | Permission model, RLS approach |
| 11 | [Current system audit](../../../01-project/current-system-audit.md) | Findings and the containment plan |
| 12 | [CI/CD](../../../08-infrastructure/ci-cd.md) and [testing strategy](../../../09-quality/testing-strategy.md) | Gates you are willing to enforce |

## Sign-off

| Reviewer | Parts | Date | Result (Approved / Approved with comments) |
| -------- | ----- | ---- | ------------------------------------------ |
| ⬜ | 1–2 | | |
| ⬜ | 3 | | |
