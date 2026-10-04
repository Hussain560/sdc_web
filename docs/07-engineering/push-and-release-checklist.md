# Push and First Release Checklist

| Field            | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Last Updated** | 2026-10-04                                                                              |
| **Status**       | Prepared locally. **Nothing has been pushed**: the origin push URL is disabled on purpose (owner rule) |

Remotes: `origin` = `Hussain560/sdc_web` (where the dev Vercel and dev Supabase are connected today), `upstream` = `sdc-saudi/SDC_website` (the target canonical repository). Which repository does what is described in [dev environment setup](dev-environment-setup.md#repositories-and-environments). Hosted dev environment: [dev environment setup](dev-environment-setup.md).

Standards followed: [git workflow](git-workflow.md) (branches, Conventional Commits), [CI/CD](../08-infrastructure/ci-cd.md)
(quality gates), [versioning and releases](versioning-and-releases.md), [cutover runbook](../08-infrastructure/cutover-runbook.md).

## 1. Where the code is now (local)

| Branch | Content |
| ------ | ------- |
| `production` | (to create) what Vercel serves live; moved only by a reviewed PR from `main` ([git workflow](git-workflow.md)) |
| `main` | Still the two "initial commit" baseline commits from the remote. Production only, tags only |
| `develop` | `main` plus the whole platform rebuild, merged from `chore/platform-foundation` with one merge commit (the local equivalent of the PR) |
| `release/v1.0.0` | Cut from `develop` for stabilization; carries the release candidate tag `v1.0.0-rc.1` (local) |
| `chore/platform-foundation` | The working branch, kept for history. Delete after the PR is merged on GitHub |

Tags: `v1.0.0-rc.1` only. **`v1.0.0` is not created**: it is tagged by the owner after the production cutover succeeds.

## 2. Is it ready to push?

The code is ready for a first push **to a feature or `develop` branch so GitHub CI can run for the first time**. It is not ready to
become `main`/production, for these reasons:

| Blocker | Why | Owner |
| ------- | --- | ----- |
| CI has never run on GitHub | The workflows were written and checked locally only; expect first-run fixes (secrets, Supabase CLI start, timing) | Tech lead |
| Visual baselines were made on Windows | `npm run e2e` compares screenshots; Linux runners render fonts slightly differently, so the visual job may fail on the first run. If it does, regenerate the baselines **in CI** (Linux) once, with approval, and commit them | Tech lead + owner |
| Branch protection and required checks are not set | Settings below | GitHub org owners |
| Secrets and variables are missing | `SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY`, `HEALTH_URLS`, Vercel and Supabase tokens | Owners |
| Privacy wording (Q-031) and production projects | See the cutover runbook | Leadership |

## 3. One-time GitHub setup (org owners)

1. Repository `sdc-saudi/SDC_website`: default branch `main`; create `develop` from the pushed branch.
2. Branch protection for `main` and `develop`: pull request required, one review, branches up to date, no force push, no deletion.
3. Required status checks: `Lint · types · unit tests`, `Build`, `E2E + visual regression`, `Auth E2E (local Supabase)`, `Database policy tests (pgTAP)`, `Conventional Commits (PR title)`.
4. Replace the placeholder team handles in `.github/CODEOWNERS`.
5. Environments `staging` and `production` (required reviewers for production); add the secrets listed in [environment variables](../08-infrastructure/environment-variables.md).
6. Enable Dependabot alerts and secret scanning.

## 4. First push, step by step (only when the owner says go)

```bash
git remote set-url --push origin https://github.com/sdc-saudi/SDC_website.git   # re-enable pushing
git push -u origin develop                    # first CI run on develop
git push origin release/v1.0.0                # optional: CI on the release branch
git push origin v1.0.0-rc.1                   # the release candidate tag
```

Then: open a PR `release/v1.0.0` → `main` titled `release: v1.0.0`, wait for every required check, fix forward on the release
branch, deploy the release candidate to **staging** and run the [event lifecycle guide](event-lifecycle-test-guide.md) there.
The AGENTS.md rule "never push" and the disabled push URL are owner decisions: change them yourself when you decide to publish.

## 5. Releasing

1. Production cutover per the [runbook](../08-infrastructure/cutover-runbook.md) (backup, migrate, deploy, smoke).
2. When the smoke test passes, merge the release PR (squash is not used: keep the history) and tag `v1.0.0` on `main`
   (release-please can open the release PR and tag automatically from `main`).
3. Merge `main` back into `develop`; delete `release/v1.0.0`.
4. Fill in `docs/99-project-management/releases/v1.0.0.md` and announce.
5. Hotfixes follow the git workflow: `fix/…` from `main`, tag `v1.0.1`, merge back to `develop`.

## 6. Visual baselines need a freshly seeded database

The home, events and join pages show database content, so their screenshots only match a database in the state
`supabase db reset` leaves (the auth e2e suite adds test events). Run `npx supabase db reset` before `npm run e2e` or
`npm run e2e:update`; CI always starts from a fresh seed.

## 7. Pre-push verification (done locally on the release branch)

`npm run check`, `npx supabase test db`, `npm run e2e`, `npm run e2e:auth`, `node scripts/check-bundle.mjs`
(after `npm run build`), `node scripts/restore-drill.mjs`, `node scripts/cutover-rehearsal.mjs`.
