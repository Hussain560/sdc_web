# Sprint 18 — Build order

Data and rules first, so the screens are built on a database that already enforces the lifecycle
([lifecycle.md](./lifecycle.md)). Each step is one pull request with its pgTAP and unit tests.

1. **Send the design brief** ([`CLAUDE-DESIGN-PROMPT-MEMBERSHIP-LIFECYCLE.md`](../../../10-design-system/CLAUDE-DESIGN-PROMPT-MEMBERSHIP-LIFECYCLE.md))
   to Claude Design; save the returned screens under `designs/` in this folder with a `README.md` index, as in Sprint 17.
2. **MBR-007** applications data v2 (split names with the full-name trigger, reference, `info_requested`, tracking token).
3. **MEM-017** member states v2 (one transition function, `inactive` → `ended`, positions follow, RLS requires `active`).
4. **ACC-008** account block (`users.block`, auth ban, sign-in state check) — the notice UI waits for the designs.
5. **MEM-016** term, cron route, reminders, renew; **NOT-004** e-mail templates alongside.
6. **ACC-009** activation reminders and resend.
7. Screens after design approval: MBR-008 join form → MBR-011 review page → MBR-010 list → MEM-018 bulk actions →
   MEM-019 member detail → MBR-009 tracking page → sign-in notices and onboarding.
8. The lifecycle end-to-end test, docs, then the visual baselines in a separate `chore(visual)` change.

## Where each step stands (2026-10-24)

| Step | Status |
| ---- | ------ |
| 1 Design brief and boards | ✅ boards saved under `designs/` |
| 2 MBR-007 | ✅ |
| 3 MEM-017 | ✅ |
| 4 ACC-008 | ✅ (blocked sign-in fixed in migration `…1300`) |
| 5 MEM-016 + NOT-004 | ✅ |
| 6 ACC-009 | ✅ (7-day activation token, five-step onboarding) |
| 7 Screens | ✅ all, then reworked after the owner's reviews (see "Delivered beyond the plan" in the plan) |
| 8 Lifecycle end-to-end test, docs, visual baselines | 🔶 docs ✅ · **e2e journey ⬜ · baselines ⬜** (see [NEXT-STEPS.md](./NEXT-STEPS.md)) |
