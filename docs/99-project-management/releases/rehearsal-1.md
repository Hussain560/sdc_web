# Cutover rehearsal 1 — 2026-10-03

| Field | Value |
| ----- | ----- |
| **Kind** | Local rehearsal on a restored copy of the local database (`node scripts/cutover-rehearsal.mjs`) |
| **Result** | Passed |
| **Total time** | 46266 ms |

| Step | Time | Result |
| ---- | ---- | ------ |
| 1. pre-flight: source reachable, legacy tables present | 4861 ms | ok — 2 legacy table(s), 9 members, 6 events |
| 2. backup (pg_dump, public + private + auth) | 1471 ms | ok — 504 KB |
| 3. restore into the rehearsal copy | 16159 ms | ok — row counts match the source |
| 4. pending migrations (supabase db push --dry-run equivalent) | 629 ms | ok — 26 files, 26 applied locally, 0 pending |
| 5. contract migration (reconciliation guard + drop legacy tables) | 1769 ms | ok — legacy tables dropped |
| 6. smoke checks on the copy | 9434 ms | ok — 4 views read, counts unchanged, 50 policies, 33 RLS tables |
| 7. rollback test: restore the backup again and compare with the source | 11943 ms | ok — the pre-cutover state is fully recoverable from the backup |

This proves the sequence, the contract guard and the rollback path with the local sample data. The production rehearsal
(a restored copy of the real backup, with the real timings) is an owner action before `v1.0.0`
([cutover runbook](../../08-infrastructure/cutover-runbook.md)).
