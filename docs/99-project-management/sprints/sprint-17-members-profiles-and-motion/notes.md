# Sprint 17 — Notes (living log)

| Field | Value |
| ----- | ----- |
| **Branch** | `feat/sprint-17-members-and-motion` (from `develop` at `aed6d0b`) |
| **Started** | 2026-10-17 |
| **Local stack** | Supabase containers `*_sdc_web` (start with `docker start`, or `npx supabase start` on Node 24); web with `npm run dev` |

## Status (2026-10-17, evening)

| Step | Story | State |
| ---- | ----- | ----- |
| 0 | Setup, designs, plan | ✅ Done |
| 1 | MEM-011 data model v3 | 🔄 Three migrations written (`20270409000000` to `…0200`), **not yet run**: waiting for Docker. Completeness function and its fixtures done and tested |
| 2 | MEM-012 photo upload | 🔄 Crop maths and `ImageCropper` done and tested (commit `df70407`). Bucket, policies, upload action and consent step wait for the database |
| 3 | MOT-001 foundation | ✅ Done (commit `251e778`): `motion` 14.3.0, `motion.css`, `src/lib/motion.ts`, `MotionProvider`, About and Events on the shared classes |
| 4 | ACC-007 assign position | 🔄 `Combobox` primitive done and tested (commit `f05b758`). Search RPC, the reproduction of the failure and the dialog rewrite wait for the database |
| 5–7 | Wizard, dashboard, editor, public pages, roll-out | ⬜ Not started |

## Blocker: Docker Desktop

Docker Desktop's WSL virtual machine froze (even `wsl -l -v` hangs, and Docker shows "WSL is unresponsive").
Starting, inspecting or removing the `supabase_db_sdc_web` container hangs. Fix needs an administrator PowerShell
(`wsl --shutdown`, `Restart-Service WSLService -Force`) or a restart of the computer. Until it is fixed: no
migration has run, the DB types are not regenerated, and `src/modules/members/queries.ts` has two type errors
(`about_ar`, `about_en`) that disappear once `npm run db:types` runs against the new schema. Those edits and the
migrations are therefore uncommitted on purpose.

## Decisions and deviations

- **Motion features.** The design says `domAnimation`; drag (marquee) and layout animation (wizard, skills, grid) need `domMax`. `MotionProvider` has two feature sets and wraps ONE island, not the layout, so pages without an island ship none of the library. The "under 15 KB" budget holds for `animation`-only islands; `domMax` islands are larger (about 25 KB gzipped by the library's own figures). The bundle check script is written with the marquee island.
- **Class names.** `page-motion.css` became `motion.css`; `pg-*` classes became `m-*` (`m-reveal`, `m-in`, `m-lift`, `m-count`, `m-float`, `m-marq`, `m-line`, `m-snap`). The scroll reveal range now follows the spec (`entry 0%` to `cover 22%`). Playwright runs with reduced motion, so baselines are unaffected.
- **Photo format.** The browser makes WebP; where it cannot encode WebP (older Safari) it makes JPEG, so storage paths end in `.webp` or `.jpg`.
- **Combobox** closes with Escape without closing a dialog around it (it stops the key), and always answers: hint, loading, results, nobody found, error with retry, restricted.

## Log

- 2026-10-17: designs approved and stored in `designs/`; plan agreed ([implementation-plan.md](./implementation-plan.md)).
- 2026-10-17: MOT-001, `Combobox`, photo crop maths and `ImageCropper` committed. Migrations 1–3 written. Docker blocked (see above).
