# Access Inventory (template)

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **Last Updated** | 2026-10-03                                   |
| **Status**       | Template: the owners fill it in before launch |

Rule: every service has **two owners**, neither of whom is the only person who knows a secret. Secrets themselves live in the
service or in a password manager, never in this file. Review the table every quarter and whenever someone leaves.

| Service | What it holds | Owner 1 | Owner 2 | Where the secrets live | Last reviewed |
| ------- | ------------- | ------- | ------- | ---------------------- | ------------- |
| Domain registrar / DNS | The domain, SPF, DKIM, DMARC records | | | Registrar account | |
| GitHub organization | Code, workflows, repository secrets | | | GitHub | |
| Vercel team | Hosting, production variables, crons | | | Vercel | |
| Supabase organization | Production and staging databases, Auth | | | Supabase | |
| E-mail provider | Sending domain, SMTP credentials | | | Provider + `SMTP_URL` in Vercel | |
| Backup encryption key | Decrypts nightly backups | | | Password manager, two copies | |
| `CRON_SECRET`, service role key | Server-only access | | | Vercel | |
| Social accounts (X, LinkedIn, Instagram) | Announcements | | | Password manager | |

## When someone leaves

1. Remove them from GitHub, Vercel, Supabase, the e-mail provider and the password manager.
2. Rotate every secret they could read (`CRON_SECRET`, SMTP password, service role key, backup key).
3. Remove their `role_assignments` in the dashboard; confirm in the audit log.
4. Update this table.
