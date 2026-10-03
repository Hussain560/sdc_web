# ADR-012 — Adopt the KFUCS Event Model and 4-Step Creation Wizard

| Field | Value |
| ----- | ----- |
| **Status** | Accepted (stakeholder direction, 2026-10-02); thresholds and types still **OPEN** (Q-019, Q-020, Q-040) |
| **Date** | 2026-10-02 |
| **Supersedes** | The sectioned single-page event form in the first draft of [13-event-form](../10-design-system/INTERNAL-SCREENS/13-event-form.md) and the "deferred" rows for attendance sessions, presenters and certificates in [reference projects §2](../98-reference/reference-projects.md#2-kfucs-portal) |
| **Related** | [KFUCS event alignment](../98-reference/kfucs-event-model-alignment.md), [event lifecycle](../03-business-domain/event-lifecycle.md), [events entities](../05-database/entities/events.md), [ADR-004](./ADR-004-authorization-model.md) |

## Context

The first draft designed event creation as one long sectioned form and deferred KFUCS's attendance sessions, presenters and certificates until SDC answered Q-019/Q-020. The stakeholder asked why event creation is not a wizard like KFUCS, and why it does not use the same data and logic.

There was no SDC-specific reason to diverge. KFUCS is maintained by the same team, runs in production on the same stack (Next.js 16 + Supabase), and its event module has already been through a full audit (findings F-04 … F-38) and three hardening sprints. Re-deriving a different model for SDC would cost design time and lose those lessons.

## Decision

1. **Creation UX:** a **4-step wizard**, the same as KFUCS: **Identity → Logistics → Content → Review**. It has per-step Zod validation, a clickable progress bar for completed steps, a live preview card, and a draft persisted in `localStorage` so a refresh does not lose work. Editing an event reopens the same wizard, pre-filled.
2. **Data model:** SDC uses the KFUCS event shape:
   - Scheduling uses `schedule_type` (single day / consecutive range / specific dates) with `start_date`, `end_date`, `dates[]`, `start_time` and `end_time`.
   - Location uses `location_mode` (in person / online / hybrid), bilingual location, `meeting_url` + `meeting_notes` (private), and a required `group_link`.
   - Registration uses `seats` and `registration_end_at`.
   - Content uses goals and FAQ (bilingual), presenters (`event_presenters`) and the cover image.
   - `display_config` toggles cover presenters, goals, FAQ, seats remaining and auto-close registration.
3. **Logic:** SDC adopts the KFUCS logic too:
   - Registration **acceptance** is a separate axis from **attendance**.
   - Attendance is recorded per scheduled day as **sessions**, with QR, online and manual check-in.
   - Each person can check in only once per session; the database enforces this.
   - The attendance percentage has **one** canonical definition: finalized sessions on the current schedule.
   - Attendance must be **finalized** before an event can be completed.
   - **Certificates** are eligibility-based, with a frozen attendance snapshot.
   - Email uses a **per-recipient outbox** with retry; a failed email never rolls back a decision.
4. **SDC adaptations** (deliberate, small):

| KFUCS | SDC | Why |
| ----- | --- | --- |
| `title_en` required, Arabic optional | `title_ar` required, English optional | SDC is Arabic-first ([principles](../00-product/principles.md)) |
| Types `WORKSHOP · BOOTCAMP · HACKATHON · MEETING` | Same four, plus `MEETUP` and `TALK`, which the current SDC events use (**OPEN Q-040**) | The existing SDC events include meetups |
| `academic_semester_id` | Dropped | SDC is not a university club |
| `REGISTRATION_CLOSED`, `IN_PROGRESS` stored by a status sweep job | Shown with the **same labels**, but **derived** from dates at read time (no cron) | Free-tier hosting has no reliable cron; derivation cannot drift ([ADR-001](./ADR-001-application-architecture.md)) |
| `REJECTED` (terminal) | `CHANGES_REQUESTED`, which returns the event to the author with a note | Volunteer committees resubmit rather than start over |
| Role arrays in code (`CLUB_ADMIN_ROLES`) | Permission keys (`events.create`, `events.approve`…) from the database | KFUCS's own audit F-53 ([ADR-004](./ADR-004-authorization-model.md)) |
| SDC "details" lists (responsibilities, requirements, deliverables, benefits, target audience) | Kept as **optional extra blocks** in the Content step | Current SDC event pages show them; nothing is lost when the page moves to the database |

## Alternatives considered

| Option | Why not chosen |
| ------ | -------------- |
| Keep the sectioned long form | No advantage for SDC; it differs from the tool the same organizers already use in KFUCS |
| Minimal event model now, KFUCS features later | Would need a second data migration and screen redesign; the lessons are already known |
| Copy KFUCS code verbatim | Its role checks and English-first validation would need rewriting anyway; adopt the model and UX, re-implement against SDC permissions |

## Consequences

- The events entity, lifecycle, screens 13–16 and flows F2–F4 are updated to the KFUCS shape (2026-10-02).
- **Attendance sessions and certificates move into scope** for Phase 4 (attendance) and Phase 4/5 (certificates). The **threshold** (KFUCS uses 70 %) and whether certificates are issued at all stay **OPEN Q-020**.
- `group_link` becomes required on every event (the KFUCS rule since 2026-09-16) because the acceptance email depends on it.
- Implementation can reuse KFUCS's wizard components as a **reference**, rebuilt on SDC's tokens and permission checks.
