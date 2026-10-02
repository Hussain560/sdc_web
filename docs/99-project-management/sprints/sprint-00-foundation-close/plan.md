# Sprint 00 — Foundation Close

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 00 |
| **Duration**        | 1 week (short closing sprint) |
| **Start Date**      | 2026-10-04 |
| **End Date**        | 2026-10-10 |
| **Phase / Milestone** | Phase 0 — Discovery & Foundation / M0 |
| **Target version**  | `v0.1.0` (docs + repository baseline), plus `v0.1.1` only if containment is needed |
| **Capacity**        | ~15 SP |
| **Team**            | Project owner (PO), tech lead (TL), Supabase project owner, leadership for the answers |
| **Status**          | 🔄 In progress — engineering preparation done; the remaining items need the owner (push, Supabase, leadership answers) |

## Sprint Objective

Close Phase 0 so that implementation can start:
- The work lives in the canonical GitHub repository.
- The production Supabase project has been inspected and, if exposed, contained.
- Leadership has answered the questions that block Phases 1–2.
- The documentation is reviewed.

This retires TD-001 (no version control) and R-001/R-002 (open production data), and puts M0 into review.

## User Stories

| Story ID | Title | Priority | Points | Owner | Status |
| -------- | ----- | -------- | ------ | ----- | ------ |
| FND-006 | Push branch `chore/platform-foundation` to `sdc-saudi/SDC_website`, open a PR to `main`, review, merge | P0 | 2 | PO + TL | ⛔ On hold — owner said do not push (2026-10-02); local commits ready |
| FND-004 | Branch protection on `main` (+ `develop`), ≥ 2 org owners, `CODEOWNERS` | P0 | 1 | PO | ⬜ |
| FND-003 | Inspect remote `sdc-members` read-only: schema dump, policies, grants, buckets, data volumes (Q-025) | P0 | 2 | Supabase owner + TL | ⏸ Deferred by owner (2026-10-02) |
| SEC-001 | Containment migration (only if FND-003 confirms exposure) | P0 | 3 | TL | ⏸ Deferred with FND-003 |
| FND-005 | Access inventory: GitHub, Vercel, Supabase, Gmail/SMTP, domain owners; shared password manager | P0 | 1 | PO | ⬜ Template ready: [access inventory](./access-inventory.md); the owner fills it |
| FND-002 | Answer the P1 open questions (list below) | P0 | 3 | Leadership | ⬜ |
| FND-001 | Review the documentation; mark the reviewed docs *In Review* / *Approved* | P0 | 3 | PO + TL | ⬜ Review pack ready: [docs review checklist](./docs-review-checklist.md) |
| FND-007 | Repository hygiene audit: no secrets tracked, `.env.local` ignored, line endings | P0 | 1 | TL | ✅ Done 2026-10-02 — nothing sensitive tracked; `.gitattributes` normalises LF |
| FND-008 | Commit-attribution policy: no `Co-Authored-By` trailers (owner request) and clean the history before any push | P1 | 1 | PO + TL | 🔄 Rule saved; three local commits still carry the trailer; rewrite them (local only) when the owner confirms |
| FND-009 | Create the GitHub teams referenced in `CODEOWNERS` (`tech-leads`, `product-owners`) | P1 | 1 | PO | ⬜ |
| FND-010 | The "push go" checklist: what must be true before the first push (below) | P1 | 1 | PO + TL | ⬜ Draft below |

## Technical Tasks

1. **Push and PR.** Get the owner's OK, then:
   - `git push -u origin chore/platform-foundation`.
   - Open a PR titled "Platform foundation: docs, Next.js 16 + TypeScript, agent skills". The body lists the 4 commits and the verification (build, typecheck, lint, visual parity).
2. **Repository settings.**
   - Protect `main`: require a PR and 1 review; no force-push.
   - Create `develop` from `main` after the merge.
   - Enable Dependabot alerts.
3. **Remote inspection (Q-025).** The owning account runs:
   - `npx supabase login`
   - `npx supabase link --project-ref zsftsxppzmebulflyhrq`
   - `npx supabase db dump --linked --schema public -f supabase/remote_schema.sql`
   - `npx supabase db dump --linked --data-only --schema public` counts only (no data leaves the machine).

   Then record the results in [current schema §remote](../../../05-database/current-schema.md) and answer Q-025.
4. **Containment (conditional).** Migration `20261005000000_containment.sql` per [security model §16](../../../06-security/security-model.md#16-containment-of-current-critical-findings):
   - Revoke the anon write on `members`, and the anon read/update on `event_registrations`.
   - Set `verify_jwt = true` on the email functions.
   - Disable `check-email-exists`.

   Ship it as `v0.1.1` with a release record; smoke-test registration and `/committee` review.
5. **Questions session.** One 60-minute meeting with leadership using [open questions §1](../../../90-decisions/open-questions.md). Record the answers in the same file (Answered + date).
6. **Docs review.** The PO reads [product overview](../../../00-product/product-overview.md), the [audit](../../../01-project/current-system-audit.md), [ADR-012](../../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md) and the [public](../../../10-design-system/PUBLIC-SCREENS/README.md) and [internal](../../../10-design-system/INTERNAL-SCREENS/README.md) screen blueprints. Comments go on the PR.

### P1 questions to answer this sprint

| Question | Unblocks |
| -------- | -------- |
| Q-025 production state, Q-026 data to migrate | Containment, Phase 1 baseline |
| Q-003 role list, Q-039 first admins and current reviewer | Phase 2 RBAC (Sprint 04) |
| Q-004 committees list | Phase 2 committees seed |
| Q-005 event approver | Phase 3A (Sprint 05) |
| Q-011 next intake date | Order of 3A vs 3B |
| Q-010 / Q-017 email provider and sender domain | Phase 2 auth email |
| Q-040 event types | Wizard step 1 |

### Push-go checklist (FND-010)

1. Restore the push URL: `git remote set-url --push origin https://github.com/sdc-saudi/SDC_website.git`.
2. `npm run check` and `npm run e2e` are green locally.
3. Settle the commit-trailer question (FND-008): rewriting history is only safe **before** the first push.
4. Push `chore/platform-foundation`, open the PR into `main`, let CI run once. Expect the visual job to differ on Linux fonts, then regenerate the baselines there (Sprint 01 ENG-012).
5. Turn on branch protection with the CI checks as required (FND-004).

## Dependencies

| Dependency | Source | Status | Resolution |
| ---------- | ------ | ------ | ---------- |
| Owner OK to push to GitHub | Project owner | Pending | Reply in chat / PR |
| Supabase owning account access | Project owner | Pending | Owner runs step 3 or grants access |
| Leadership availability | Leadership | Pending | Schedule the session in week 1 |

## Acceptance Criteria

- [ ] `main` of `sdc-saudi/SDC_website` contains the foundation; `main` is protected.
- [ ] The remote schema is recorded; Q-025 is answered; containment is either applied (with a `v0.1.1` record) or explicitly not needed.
- [ ] Every P1 question is answered or has an owner and a date.
- [ ] Tag `v0.1.0` created per [versioning](../../../07-engineering/versioning-and-releases.md).

## Sprint Review Checklist (demo script)

- [ ] Show the PR and repository settings.
- [ ] Show the remote-vs-local policy comparison.
- [ ] Walk through the screen blueprints (KFUCS wizard, attendance sessions, public pages).
- [ ] Confirm the Sprint 01 scope.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Supabase owner unreachable | Medium | High (exposure unknown) | Treat production as exposed; prepare containment SQL so it can run in minutes |
| Leadership answers are slow | High | Medium | The recommended defaults in open questions apply as assumptions (A-xxx) and are revisited later |
| Old repo history conflicts | Low | Low | The branch is based on `origin/main`; nothing is rewritten |

## References & Specifications

- [Roadmap § Phase 0](../../roadmap.md#phase-0--discovery--foundation), [milestones M0](../../milestones.md)
- [Open questions](../../../90-decisions/open-questions.md), [decision log](../../../90-decisions/README.md)
- [Security model §16](../../../06-security/security-model.md#16-containment-of-current-critical-findings)
