# Sprint 15 — Public Redesign I: Chrome Roll-out, Home, Event Page and Registration Dialog

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 15 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2027-04-25 (indicative, Q-S2) |
| **End Date**          | 2027-05-08 |
| **Phase / Milestone** | Phase 7 — Public redesign / M9 |
| **Target version**    | contributes to `v1.1.0` |
| **Capacity**          | ~28 SP — planned 28 SP |
| **Team**              | Tech lead + volunteer developers; owner for copy and approvals |
| **Status**            | ⬜ Planned |

## Sprint Objective

Every public page uses the v2 header and footer. The home page and the event page (the two pages most visitors see) are rebuilt on Design System v2. Registration works through the single dialog with the **≥ 1.5 s progress state** and the result dialogs, and is proven by tests. Demo: from the home page to a registered result for an open event, then the waiting-list, full, duplicate and throttled results, in AR/EN × dark/light, desktop and phone.

Specs: [01-home](../../../10-design-system/PUBLIC-SCREENS-V2/01-home.md), [02-event-page](../../../10-design-system/PUBLIC-SCREENS-V2/02-event-page.md), [00-chrome](../../../10-design-system/PUBLIC-SCREENS-V2/00-chrome.md), [feedback pattern](../../../10-design-system/patterns.md#13-confirmation-and-feedback).

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| RDS-010 | Mount SiteHeader/SiteFooter on every public route; retire the legacy Header/Footer | P0 | 2 | — | ⬜ |
| RDS-011 | Event data additions: per-day place, `what_to_bring`, public certificate settings, public presenters view | P0 | 3 | — | ⬜ |
| RDS-012 | Home page v2 (announcement, hero, stats, events, why join, articles, partners, CTA, FAQ) | P0 | 6 | — | ⬜ |
| RDS-013 | Event page v2: hero, side panel / sticky action bar, sections, all 13 states | P0 | 6 | — | ⬜ |
| RDS-014 | Registration dialog v2: form, 1.5 s minimum progress, result dialogs for every outcome | P0 | 5 | — | ⬜ |
| RDS-015 | Add to calendar (`/events/[slug]/calendar.ics`) | P1 | 1 | — | ⬜ |
| RDS-016 | Check-in page v2 (and the venue QR card) | P1 | 2 | — | ⬜ |
| RDS-017 | Public stats view for the home figures | P1 | 3 | — | ⬜ ⛔ Q-H2 |

### Acceptance criteria per story

**RDS-010 — Chrome roll-out**
- Every route under `app/[locale]` except `(auth)` renders SiteHeader and SiteFooter; the legacy `src/components/Header` and `Footer` and their CSS are deleted.
- The skip link is the first focusable element; `scroll-padding-block-start` keeps focused headings visible.

**RDS-011 — Event data** (migration `<ts>_event_public_v2.sql`)
- `event_dates.location_ar`, `location_en` (nullable, ≤ 500); `save_event` accepts them for `specific_dates`; the wizard shows them per date.
- The wizard writes `details.what_to_bring` ({ar[], en[]}, ≤ 15); `getPublicEvent` maps it.
- `site_settings.certificates_enabled` and `certificate_threshold` become `is_public = true` (owner approved this as part of the design).
- `public_event_presenters` view: presenter name, title, role, link, photo (guest photo or the profile `avatar_path`) for published events only; `security_invoker` off, public columns only.
- pgTAP: the new columns, the view's rows for draft events (none), and anon can read the two settings but no other private setting.

**RDS-012 — Home**
- Sections, order, rules and states exactly as [01-home](../../../10-design-system/PUBLIC-SCREENS-V2/01-home.md); each section with no data is hidden (unit test on the section-visibility helper).
- The intake phase drives the hero primary and the CTA band (scheduled / open / closed / none, and signed-in member).
- Owner copy (Q-H1, Q-H3, Q-H4) comes from the message catalogue; until it's supplied, the sections that need it are hidden by a feature flag (no placeholder ships).
- Data: `public_events` (3 upcoming, else 3 past), `public_articles` (4), `partners` (active), `membership_cycle_phase`, `public_stats` (RDS-017).

**RDS-013 — Event page**
- The hero shows the title, date and time, place or "online", seats left and one primary action at first paint (server-rendered; the LCP is the title, not the cover).
- All states S1–S13 + loading + not found from [02-event-page §4](../../../10-design-system/PUBLIC-SCREENS-V2/02-event-page.md#4-event-states), driven by a pure `eventViewState(event, viewer, session, now)` function with unit tests for every row of the table, including the S3 thresholds (48 h, max(3, 10%)).
- Desktop: a sticky 360 px side panel; below 1024: the facts list + a fixed bottom action bar that never covers content (padding) or a focused element.
- Sections render only with data; the in-page nav lists only rendered sections; multi-day events show one day card per `event_dates` row with its own time and place.
- The certificate rule shows only when `certificate_available` and `certificates_enabled`, with the threshold from settings.
- The map is a link, never an embed; `map_url` must be https.

**RDS-014 — Registration dialog**
- One button opens the dialog (bottom sheet below 768). Guests: name, e-mail, phone, optional university, consent, honeypot. Signed-in members: a pre-filled confirm.
- On a valid submit the button **and** the dialog switch to loading **immediately**: the form is `inert`, close and Esc are disabled with the reason shown, the progress bar runs, `role=status` announces "جارٍ تسجيلك… / Registering you…".
- The result is shown at `max(server answer, press + 1500 ms)` for **every** outcome (success, refusal, error); a 15 s timeout shows "try again".
- Each outcome shows its own result dialog (icon, title, one sentence, one action) per [02-event-page §5.3](../../../10-design-system/PUBLIC-SCREENS-V2/02-event-page.md#53-results). Duplicate, too fast and throttled are never shown as a generic error; honeypot and fill-time refusals look like "too many attempts".
- The existing protections stay: the `ref` double-submit lock, the 2.5 s client cooldown after an error, and the database throttles.
- Focus moves to the result title; "Add to calendar" downloads the `.ics`.

**RDS-015 — Calendar**
- `GET /[locale]/events/[slug]/calendar.ics` returns a valid VCALENDAR (one VEVENT per date, Asia/Riyadh TZID, place or "Online", the event URL), cached; 404 for unpublished events; no personal data.

**RDS-016 — Check-in**
- The page and its states from [02-event-page §6](../../../10-design-system/PUBLIC-SCREENS-V2/02-event-page.md#6-check-in-page-eventsslugcheck-in); submit uses the same 1.5 s floor; the QR panel uses `--qr-ground`.

**RDS-017 — Public stats** ⛔ Q-H2
- A `public_stats` view returns counts only (events held, listed members, active committees, certificates issued) for the figures the owner approves; the home row hides any figure the view doesn't return.

## Pull requests (in this order)

| PR | Content | Stories |
| -- | ------- | ------- |
| 1 | Mount the new chrome everywhere, delete the legacy header/footer | RDS-010 |
| 2 | Home page v2 (stats row hidden until PR 9) | RDS-012 |
| 3 | Migration + wizard fields + pgTAP for the event data additions | RDS-011 |
| 4 | `eventViewState()` + unit tests (no UI) | RDS-013 |
| 5 | Event page v2 layout, hero, side panel, action bar, sections | RDS-013 |
| 6 | `withMinimumDuration()` + `registrationResult(code)` mapping + unit tests (no UI) | RDS-014 |
| 7 | Registration dialog v2 + result dialogs | RDS-014 |
| 8 | `.ics` route; check-in page v2 + QR card | RDS-015, RDS-016 |
| 9 | `public_stats` view (after Q-H2) and the home stats row | RDS-017 |
| 10 | `chore(visual)`: approved baselines for chrome, home, event page | — |

The order follows the brief: tokens and components (Sprint 14) → auth layout (Sprint 14) → **home → event page and its dialog** (this sprint) → members → remaining pages (Sprint 16).

## Page matrix

| Page | Components | Data read | States | Tests |
| ---- | ---------- | --------- | ------ | ----- |
| Chrome | SiteHeader, SiteFooter, Logo, LocaleSwitch, ThemeSwitch, Dialog (sheet) | `site_settings` (public), `AccessContext` | signed out / in / with dashboard permission; current page; menu open | Playwright: nav, menu sheet keyboard, `aria-current`; axe |
| Home | Hero, StatsRow, SectionHeader, EventCard, SegmentedToggle, FeatureCard, ArticleCard (featured + list), partner strip, CtaBand, Accordion | `public_events`, `public_articles`, `partners`, `membership_cycle_phase`, `public_stats` | loading, every section empty, intake phases × 4, signed-in member | Unit: section visibility, intake → CTA mapping. Playwright: AR/EN × dark/light × desktop/360 snapshots with seeded data **and** with empty data; axe |
| Event page | Breadcrumb, StatusPill, Badge, DateChip, Card, Progress, Button, Timeline, Avatar, Accordion, EventCard, Alert | `public_events` (`getPublicEvent`), `event_dates`, `public_event_presenters`, `my_registrations`, check-in context, `site_settings` | S1–S13, loading, 404 | Unit: `eventViewState` (every state). Playwright: one seeded event per state (snapshot + the primary action label), sticky bar on 360, in-page nav; axe |
| Registration dialog | Dialog/sheet, Field, Checkbox, Progress, ResultDialog | `register_guest`, `registerForEvent` | form, field errors, sending, 9 results | **Timing tests below**; Playwright per outcome |
| Check-in | Card, Field, ResultDialog | `check_in_public_context`, check-in action | form, checked in, already, not open, expired, not accepted, throttled | Extend `tests/auth/attendance.spec.ts` |

## Registration timing and feedback tests (required)

| # | Test | Kind | Assertion |
| - | ---- | ---- | --------- |
| T1 | `withMinimumDuration` resolves at the floor when the server is fast | Vitest, fake timers | Server resolves at 200 ms → the wrapped promise is still pending at 1499 ms and settles at 1500 ms |
| T2 | Slow server | Vitest, fake timers | Server resolves at 2300 ms → settles at 2300 ms (no extra wait) |
| T3 | Errors wait too | Vitest, fake timers | Rejection at 100 ms → rejects at 1500 ms |
| T4 | Locked while sending | Vitest + RTL, fake timers | After submit: button `aria-busy`, form `inert`, Esc and close do nothing, a second submit is ignored, until 1500 ms |
| T5 | Each outcome → its dialog | Vitest + RTL, table-driven | For `accepted`, `pending`, `waitlisted`, `ALREADY_REGISTERED`, `EVENT_FULL`, `CAPACITY_REACHED`, `REGISTRATION_CLOSED`, `RATE_LIMITED`, `TOO_FAST`, `MEMBERS_ONLY`, `INTERNAL`, timeout: the right icon, title, sentence and action (AR and EN) |
| T6 | Validation never waits | Vitest + RTL | Invalid fields show errors immediately; no request is sent |
| T7 | End to end, real database | Playwright (`tests/auth/guest-registration.spec.ts`) | Seeded events for open, waitlist, full, closed, members-only; for each: click Register → the loading state is visible at +1.2 s → the result is **not** visible before +1.5 s → the correct result title is visible after |
| T8 | Duplicate and throttle, end to end | Playwright | Registering the same e-mail twice → "already registered"; the throttle seed → "too many attempts" with a countdown; a honeypot fill → "too many attempts" |
| T9 | Reduced motion keeps the floor | Playwright (`reducedMotion: 'reduce'`) | Static "Sending…" label for ≥ 1.5 s, no animation |
| T10 | Focus and announcements | Playwright + axe | Focus lands on the result title; the status region text matches the outcome |

## Dependencies

| Dependency | Source | Status | Resolution |
| ---------- | ------ | ------ | ---------- |
| Sprint 14 components | RDS-001…008 | Pending | — |
| Q-H1, Q-H3, Q-H4 copy | Owner | Pending | Sections behind a flag until supplied |
| Q-H2 public figures | Owner | Pending | RDS-017 blocked; the stats row stays hidden |
| Q-E4 closes-soon thresholds | Owner | Default assumed | Change two constants if the owner differs |
| Baseline approval | Owner | Pending | PR 11 |

## Acceptance Criteria (sprint)

- [ ] T1–T10 pass in CI.
- [ ] Every event state is reachable from a seeded event and is covered by a snapshot.
- [ ] Home and event page: zero serious/critical axe violations in AR/EN × dark/light; no horizontal scroll at 320 px; CLS < 0.1 and LCP < 2.5 s (existing perf test).
- [ ] The owner approved the new baselines before they were committed.

## Sprint Review Checklist (demo script)

- [ ] Home → event (open) → register as a guest → "You're registered" after the progress state → add to calendar.
- [ ] Same e-mail again → "already registered"; a full event with a waitlist → "waiting list"; throttled → "too many attempts".
- [ ] Members-only event as a visitor → "Apply for membership".
- [ ] A cancelled event and a finished event; check-in on a running event.
- [ ] Phone: sticky action bar and the bottom-sheet dialog.
- [ ] AR/EN × dark/light.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| The 1.5 s floor feels slow | Low | Low | It's the owner's explicit requirement; the progress state explains it |
| Flaky timing tests in CI | Medium | Medium | Unit tests use fake timers; e2e asserts windows (≥ 1.5 s, < 15 s), not exact times |
| Copy not ready | High | Medium | Feature flags hide sections; nothing invented ships |
