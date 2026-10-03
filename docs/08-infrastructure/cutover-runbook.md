# Production Cutover Runbook

| Field            | Value                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| **Last Updated** | 2026-10-03                                                                      |
| **Status**       | Ready for the production rehearsal (owner action); not yet executed in production |
| **Owners**       | Release owner + one second administrator (two people present for every step)    |

The cutover replaces the legacy site with the rebuilt platform and then removes the legacy tables. It follows the
expand → migrate → contract pattern ([deployment](deployment.md), [ADR-007](../90-decisions/ADR-007-ci-cd-strategy.md)).
The local sequence is scripted and timed by `node scripts/cutover-rehearsal.mjs --record`
([rehearsal 1](../99-project-management/releases/rehearsal-1.md)). Run the same sequence against a restored copy of the **real**
backup before the day, and record it as `rehearsal-2.md`.

## 1. Before the day (T-7 … T-1)

| # | Step | Owner | Done when |
| - | ---- | ----- | --------- |
| 1 | Production Supabase project and Vercel project exist; domain and DNS are controlled by SDC ([access inventory](../07-engineering/access-inventory-template.md)) | Leadership | Two owners listed per service |
| 2 | E-mail domain verified (section 6) and a test e-mail reaches Gmail and Outlook inbox | Tech lead | SPF, DKIM, DMARC pass in the message headers |
| 3 | Production variables set in Vercel; `node scripts/preflight-production.mjs --env <file> --online` prints "Pre-flight passed" | Tech lead | No BLOCK lines |
| 4 | Hosted Auth settings match `supabase/config.toml` (section 7) | Tech lead | Checklist ticked |
| 5 | GitHub secrets `SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY` (held by two administrators) and variable `HEALTH_URLS` set; run `backup` and `keepalive` once by hand | Admin | Both runs green; artifact decrypts |
| 6 | Rehearsal on a restored copy of the real backup passes, including the rollback test | Release owner | `rehearsal-2.md` written, timings known |
| 7 | Privacy notice wording approved (Q-031) and `PRIVACY_VERSION` updated | Leadership | Legal sign-off recorded |
| 8 | Visual baselines approved and refreshed if still pending | Owner | `npm run e2e` is green |
| 9 | Announcement scheduled; freeze date told to the committees | Media | Message sent |

## 2. Freeze (T-0, start)

1. Tell the committees the legacy site is read-only from now. Stop any manual edits on the legacy project.
2. Record the time. Take a **fresh logical backup** of the production database (`supabase db dump`, schema and data, encrypted) and note the restore point in the release record. Do not continue without it.
3. Check `/api/health` of the staging site is `ok`.

## 3. Migrate (expand, migrate)

| Step | Command / action | Expected result | Rollback |
| ---- | ---------------- | --------------- | -------- |
| 3.1 | `npx supabase db push --linked --dry-run` | Lists exactly the migrations of the release | Stop |
| 3.2 | `npx supabase db push --linked` | All applied, no error | Restore the backup (section 8) |
| 3.3 | Run the data migration check: `select count(*) from members_legacy` equals the mapped `members` rows (the contract guard in 5.1 repeats it) | Equal | Restore |
| 3.4 | Create the first administrators (Q-039): insert two `role_assignments` for `system_admin` by SQL from the owner console | Two admins can sign in | Delete the rows |

## 4. Deploy

1. Tag nothing yet. Deploy the release commit to production on Vercel (promote the verified preview).
2. Smoke test (every item must pass):
   - `/`, `/events`, `/articles`, `/members`, `/privacy`, `/login`, `/join` open in Arabic and `/en`.
   - `/api/health` returns `ok`.
   - Sign in as an administrator, open the dashboard, the audit log and the e-mail log.
   - Send a password reset to a test address; the e-mail arrives and the link opens `/reset-password`.
   - Register a guest on a test event; the confirmation e-mail arrives. Delete the test rows afterwards.
3. Check the response headers contain the CSP and HSTS; check `/api/csp-report` logs nothing unexpected.

## 5. Contract (only after the site has been stable for the agreed window, normally one week)

1. Take another backup.
2. Review `supabase/contract/README.md`, then run `supabase/contract/20270410000000_drop_legacy_tables.sql` once with `psql` against production. The guard raises `CONTRACT_REFUSED` if any legacy row is not mapped; fix the data, never edit the guard.
3. Regenerate `src/lib/supabase/database.types.ts`, remove the legacy lines from `supabase/seed.sql` and the assertions in `supabase/tests/06_registrations.sql`, run the checks, deploy.

## 6. E-mail domain checklist (SPF, DKIM, DMARC)

1. In the e-mail provider, add the sending domain and copy the DNS records it shows.
2. SPF: one TXT record for the domain that includes the provider (`v=spf1 include:<provider> ~all`); never two SPF records.
3. DKIM: add the CNAME/TXT records the provider lists, wait until the provider shows "verified".
4. DMARC: TXT `_dmarc` with `v=DMARC1; p=none; rua=mailto:<mailbox>` first; move to `quarantine` after two weeks of clean reports.
5. `EMAIL_FROM` uses an address on that domain. Send to a Gmail address, open "Show original", confirm SPF, DKIM and DMARC say PASS.

## 7. Auth settings on the hosted project

| Setting | Value |
| ------- | ----- |
| Site URL | the production origin |
| Redirect URLs | `<origin>/**` |
| Allow new users to sign up | **off** (accounts are created by the platform, ADR-013) |
| E-mail provider | enabled; custom SMTP set |
| E-mail OTP / link expiry | 86400 s (activation links must outlive a weekend) |
| Confirm e-mail | on |
| Templates | match `supabase/templates` and the platform templates (Arabic and English) |

## 8. Rollback

Decide within the freeze window. Triggers: smoke test fails on data, sign-in broken, e-mail not delivered after one fix attempt.

1. Promote the previous Vercel deployment (instant). Tell the committees.
2. If migrations ran: restore the backup from step 2 into the project (or into a new project and swap the keys), then run the smoke checks again. Never delete the failed state before it is copied for diagnosis.
3. The contract step has its own backup; after it, rollback means restore that backup.
4. Write the incident in the release record and the [operations](operations.md) incident log.

## 9. After the cutover

- Announce (see [announcement](../99-project-management/releases/launch-announcement.md)).
- Watch `/api/health`, the keep-alive workflow and the e-mail log for 24 hours.
- Fill the release record, then the owner tags `v1.0.0` and syncs `main` ([git workflow](../07-engineering/git-workflow.md)).
