# Contract migrations

Migrations here are **not** applied by `supabase db push` / `supabase db reset` (they are outside `supabase/migrations/`
on purpose). They destroy data that the application no longer reads and run **once**, by a named person, during the
production cutover or one release after the switch, **after a fresh backup** (see
`docs/08-infrastructure/cutover-runbook.md` and `docs/05-database/migration-strategy.md`, step 7).

| File | What it does | Proven by |
| ---- | ------------ | --------- |
| `20270410000000_drop_legacy_tables.sql` | Refuses to run unless every legacy row is reflected in the new tables, then drops `members_legacy`, `event_registrations_legacy` and the one-off import function | `node scripts/cutover-rehearsal.mjs` (applied to a restored copy, with smoke checks and a rollback test) |
