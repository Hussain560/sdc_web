# Definition of Done (DoD)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Active     |

## 1. Story / pull request

| Area | Criteria |
| ---- | -------- |
| Acceptance | All acceptance criteria met and demonstrated on the preview or staging deployment |
| Code | Follows [coding standards](../07-engineering/coding-standards.md); lint, format and typecheck clean; no `console.log`; no TODO without issue |
| Review | PR approved (1 reviewer; 2 for migrations, RLS, auth, permissions, secrets); PR title is a Conventional Commit |
| Security | Authorization enforced at server **and** database; inputs validated server-side; no secrets client-side; no PII in logs |
| Database | Migration reviewed; RLS + grants included; pgTAP tests added/updated and passing; generated types committed |
| Tests | Unit/integration tests for new logic; E2E updated if a critical journey changed; `npm run check` passes locally (the pre-push hook runs it) and CI is green. For UI, `npm run e2e` (visual gate) passes; baselines change only in a separate `chore(visual)` change the owner approved |
| i18n | All strings in both catalogues; verified in Arabic RTL and English LTR |
| Design | Uses Design System v2 semantic tokens and the primitives in `src/components/ui`; no colour literal outside `primitives.css` (`npm run check:tokens`) and contrast pairs pass (`npm run check:contrast`); verified in dark and light themes, Arabic RTL and English LTR, at 360 px and desktop |
| Accessibility | Keyboard operable, labelled controls, visible focus; no new axe violations |
| Docs | Affected docs updated in the same PR (module, entity, rules, requirements status) |
| Release notes | User-visible change summarized in the PR for the changelog |

## 2. Sprint

- [ ] All committed stories meet the story DoD, or are carried over with a reason in the sprint report
- [ ] `develop` deployed to staging and smoke-tested
- [ ] Sprint report written (results, metrics, retrospective, carry-over)
- [ ] Open questions and risks reviewed

## 3. Release

- [ ] Milestone acceptance criteria met ([milestones](./milestones.md))
- [ ] [Release checklist](../07-engineering/versioning-and-releases.md#4-release-process) complete, including backup and rollback plan
- [ ] [Manual QA checklist](../09-quality/manual-qa-checklist.md) passed on staging
- [ ] Tag created; CHANGELOG and GitHub Release published; release record written
