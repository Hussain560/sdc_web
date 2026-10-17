# Sprint 17 — Notes (living log)

| Field | Value |
| ----- | ----- |
| **Branch** | `feat/sprint-17-members-and-motion` (from `develop` at `aed6d0b`) |
| **Started** | 2026-10-17 |
| **Local stack** | `npx supabase start` (Node 24 on the PATH), `npm run db:personas` for the demo accounts, `npm run dev` for the web |

## Status (2026-10-17, night)

| Step | Story | State |
| ---- | ----- | ----- |
| 0 | Setup, designs, plan | ✅ Done |
| 1 | MEM-011 data model v3 | ✅ Done (`199a298`): 3 migrations, 86 pgTAP checks, completeness function |
| 2 | MEM-012 photo upload | ✅ Done (`dc58de5`): bucket and policies, photo functions, server actions, cropper, consent flow; 27 pgTAP checks |
| 3 | MOT-001 foundation | ✅ Done: `motion` 14.3.0, `motion.css`, presets, `MotionProvider` |
| 4 | ACC-007 assign position | 🔄 Cause found and fixed in the database and in the dialog (below); end-to-end run in progress |
| 5–7 | Wizard, dashboard, editor, public pages, roll-out | ⬜ Not started |

## ACC-007: why the user search did not work (reproduced locally on 2026-10-17)

Same queries as the old `searchUsers`, run as the local personas:

- A **committee head** found nobody. The `profiles` table is readable only with `users.view` (or `roles.view`), and the old action also returned an empty list when the caller lacked `users.view`. The dialog had no hint, loading or error state, so an empty answer looked like a broken search. Searching `member` as `dev.head` returned `[]` although the head's own committee has a member.
- An **administrator or leader** found people, but only by the **account** name. Members added through "Add member" got their English name on the member record and never on the account (`profiles.full_name_en`), so searching in English found nothing; middle names were not searchable at all.
- The list offered accounts, while `assign_role` requires an **active member** for committee roles, so a non-member could be picked and then refused on save.

Fix: `search_assignable_users(query, committee)` searches active members by every name part in both languages and answers according to the caller. An administrator or leader searches everyone and sees e-mail addresses. A committee head searches only the people of the own committee, sees no e-mail, and gets `restricted: true` so the dialog explains it. The function also returns the current head so the dialog can warn before saving. `handover_head` gained `p_keep_as_deputy`. The name-sync trigger from migration 1 now carries English names to the account as well.

**Deviation from the design.** The picker mock shows "other members" to a head, while its own restricted note says a head can only pick people of the committee. I followed the note (least privilege). Open question **Q-C1**: should a head be able to add any active member to their committee? Today a head cannot, as before.

## Decisions and deviations

- **Motion features.** The design says `domAnimation`; drag (marquee) and layout animation (wizard, skills, grid) need `domMax`. `MotionProvider` has two feature sets and wraps ONE island, not the layout, so pages without an island ship none of the library. The "under 15 KB" budget holds for `animation`-only islands; `domMax` islands are larger (about 25 KB gzipped by the library's own figures). The bundle check script is written with the marquee island.
- **Class names.** `page-motion.css` became `motion.css`; `pg-*` classes became `m-*` (`m-reveal`, `m-in`, `m-lift`, `m-count`, `m-float`, `m-marq`, `m-line`, `m-snap`). The scroll reveal range now follows the spec (`entry 0%` to `cover 22%`). Playwright runs with reduced motion, so baselines are unaffected.
- **Photo format.** The browser makes WebP; where it cannot encode WebP (older Safari) it makes JPEG, so storage paths end in `.webp` or `.jpg`. Upload goes through a Server Action (both files are tiny), the same pattern as covers.
- **Photo consent.** The one-time "show your photo?" question is asked when the member has no photo yet (first upload, or after a removal, which also switches the photo off).
- **Combobox** closes with Escape without closing a dialog around it, and always answers: hint, loading, results, nobody found, error with retry, restricted.
- **Dialogs and the native `close` event.** Closing a native dialog from code also fires `close`. In multi-step flows each dialog's `onClose` must act only while its own step is showing (found by a test in `PhotoUploader`).
- **Handover in the dialog.** When the chosen committee already has a head and the person may hand over, saving is the handover (the old term ends on the start date); the old head can be kept as deputy. The old "error, then hand over" step is gone.
- **Tests of the storage schema.** Supabase blocks plain SQL deletes on `storage.objects`; the pgTAP file sets `storage.allow_delete_query` because the policy is what is under test.

## Log

- 2026-10-17: designs approved and stored in `designs/`; plan agreed ([implementation-plan.md](./implementation-plan.md)).
- 2026-10-17: MOT-001, `Combobox`, photo crop maths and `ImageCropper` committed. Docker was blocked by a frozen WSL virtual machine until the owner fixed it.
- 2026-10-17: migrations 1–3 run and tested (1,349 pgTAP checks still green); DB types regenerated; MEM-011 and MEM-012 committed.
- 2026-10-17: ACC-007 reproduced and fixed (migrations 5 and 6, `searchAssignableUsers`, new `AssignRoleDialog`, 8 unit tests, 2 new end-to-end tests).
