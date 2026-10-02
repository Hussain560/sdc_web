# Sprint 12 — Quality & Security Hardening

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 12 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-03-14 |
| **End Date**        | 2027-03-27 |
| **Phase / Milestone** | Phase 5 — Quality & Security Hardening / M7 |
| **Target version**  | `v0.8.0` (M7 exit) |
| **Capacity**        | ~28 SP — planned 24 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

The platform meets WCAG 2.2 AA, an enforced CSP, the Core Web Vitals targets and the privacy obligations; backups are restorable; the remaining legacy CSS of the public pages is mapped to tokens with no visual change.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| SEC-004 | Accessibility audit and fixes; axe blocking in CI | P0 | 8 | — | ⬜ |
| SEC-002 | CSP enforced, security headers | P0 | 3 | — | ⬜ |
| SEC-003 | Privacy notice, consent capture, data-subject flows ⛔ Q-031 | P0 | 5 | — | ⬜ |
| SEC-005 | Backup workflow + restore drill | P0 | 3 | — | ⬜ |
| ENG-010 | Performance pass: `next/image` everywhere, CWV budget in CI | P1 | 5 | — | ⬜ |

## Technical Tasks

1. Run the `accessibility` and `web-design-guidelines` skills on every route ([AI agent skills](../../../07-engineering/ai-agent-skills.md)); fix focus, labels and contrast within the frozen palette.
2. CSP report-only for one week on staging, then enforce.
3. `/privacy` page ([12-new-public-pages §4](../../../10-design-system/PUBLIC-SCREENS/12-new-public-pages.md#4-privacy-notice-privacy--open-q-031)).
4. Restore drill: restore a production backup into a scratch project and record the time taken.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-031 privacy content and contact | Leadership | Pending |

## Acceptance Criteria

- [ ] axe: zero serious/critical issues on all routes.
- [ ] LCP < 2.5 s and CLS < 0.1 on 4G for the home and event pages.
- [ ] Restore drill documented in [operations](../../../08-infrastructure/operations.md).
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Keyboard-only walkthrough: register → event registration → dashboard review.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Accessibility fixes touch public visuals | Medium | Medium | Only focus rings, labels and contrast inside the palette; every visual diff explicitly approved |

## References & Specifications

- [Accessibility](../../../10-design-system/accessibility.md)
- [Data protection and privacy](../../../06-security/data-protection-and-privacy.md)
- NFR-A11Y-*, NFR-SEC-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
