# Open Questions and Assumptions

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Active — reviewed at every milestone |

## 1. How to use

- **Priority**: **P1** blocks the next phase (answer before Phase 1/2 starts) · **P2** blocks a specific module (answer before that module's sprint) · **P3** needed later or refines scope.
- **Recommended default**: what the foundation proposes if the owner agrees; it is *not* a decision until answered.
- When answered: fill *Answer / date*, create a D-nnn or ADR if significant, update affected docs, set status **Answered**.
- Owner column proposes who should answer; "PO" = product owner (Q-001).

## 2. P1 — Blocking the next phase

| ID | Question | Why it matters | Recommended default | Owner | Status |
| -- | -------- | -------------- | ------------------- | ----- | ------ |
| Q-025 | Is the remote Supabase project `sdc-members` **production**? Does it have the same open RLS policies and grants as local? What tables, data volume, storage buckets and Auth settings does it have? Who has access? | **Security emergency if yes** (anyone can modify members and read registrants' emails); baseline migration; environment plan | Inspect immediately (read-only); if exposed, apply the [containment](../06-security/security-model.md#16-containment-of-current-critical-findings) with approval | Tech lead + project owner | **Partially answered (2026-10-02)** |
| | ↳ *Finding:* the project `zsftsxppzmebulflyhrq` (`sdc-members`) is **active and in live use** — its public `assets` bucket serves the email logo (HTTP 200) and the REST/Auth APIs respond (401 without key). Its RLS policies and data **could not be verified**: the Supabase CLI on this machine is logged into an account that only owns `CyberClub-Portal`. *Next step:* the project owner runs `npx supabase login` (owning account) → `npx supabase link --project-ref zsftsxppzmebulflyhrq` → `npx supabase db dump --linked --schema public -f remote_schema.sql`, or checks *Authentication → Policies* in the dashboard for `members` / `event_registrations`. Treat production as exposed until proven otherwise. | | | | |
| Q-024 | Where is the canonical Git repository? (Local copy is not a Git repo.) Who owns the GitHub organization? Public or private? | Branch protection, CI, history, CI minutes | Create/confirm an SDC GitHub organization with ≥ 2 owners; import current code as the initial commit | Project owner | **Answered (2026-10-02)** — `github.com/sdc-saudi/SDC_website` (D-010); org owners and visibility still to confirm |
| | ↳ *Answer (stakeholder):* a repository exists but is **not up to date**; this working copy was unzipped from a teammate's copy. *Still needed:* repository URL/owner, and reconciliation — clone the repository, compare it with this copy (backup of the pre-migration copy kept), and commit this foundation work on a branch. | | | | |
| | ↳ *Answer (stakeholder, follow-up):* the repository is `https://github.com/sdc-saudi/SDC_website.git`. | | | | |
| | ↳ *Finding (2026-10-02):* the repository has 3 commits (2026-09-07, `main`). The local working copy is a **strict superset** of it — every repo file exists locally (differences are line endings plus newer local changes: light theme, password policy, assets, `seed_tables.sql`). The local work is committed on branch `chore/platform-foundation` on top of `origin/main` (4 commits), **not yet pushed** ([Sprint 00 notes](../99-project-management/sprints/sprint-00-foundation-close/notes.md)). | | | | |
| Q-027 | Is the site deployed today? Which Vercel account/team, which domain? | Environment plan, redirects, DNS | Vercel team owned by SDC | Project owner | Open |
| Q-001 | Who is the product owner that approves this documentation and answers questions? | Approvals, DoR | Community leader (A-002) | Leadership | Open |
| Q-039 | Who are the initial system administrators (≥ 2)? The person in `COMMITTEE_EMAILS` — which committee/position do they hold? | RBAC bootstrap; replacement of the email list | Two Tech & Development members as `system_admin`; reviewer mapped to their real position | Leadership | Open |
| Q-003 | Confirm the official hierarchy and positions: founders' role today, community leader, advisor, committee heads/deputies; is "Head of Projects" / "Head of Design & Identity" a committee head? Is there a vice-leader position? | Role catalogue and seeding | Catalogue in [organizational structure §2.1](../03-business-domain/organizational-structure.md#21-position-catalogue); Projects and Design & Identity treated as committees | Leadership | Open |
| Q-004 | What is the canonical list of committees? What are the home page "community sections" (Data Science, Marketing, Podcast & Content, Product Management, PR)? What does a member's "track" mean? | Committees seed, member profile model, home page | Sections = committees (update list); track = technical specialization lookup (A-006) | Leadership | Open |
| Q-014 | Are positions term-based (e.g., one year)? Who appoints the community leader and committee heads? Should former leaders be shown publicly? | Assignment rules, anti-escalation, leadership page | Annual terms; founders/leader appoint heads; heads appoint committee members; former leaders visible in an "alumni" section | Leadership | Open |
| Q-038 | The membership page "that opens once a year" — where does it live today (external form/site?), and where are past applications and the member list stored? | Data migration, D-001 implementation, Q-026 | Import past members from that source during Phase 3B | Leadership | Open |
| Q-010 | Which email provider? Who creates and owns the account? | Phase 2 Auth SMTP; Phase 3 notifications | Brevo (see ADR-006) | Tech lead + leadership | Open |
| Q-017 | Domain name and DNS access? Budget for paid tiers if needed (Supabase Pro backups, Vercel plan suitable for an organization)? | Email authentication, production setup, backups | Use an SDC-owned domain; stay on free tiers; revisit Vercel plan terms | Leadership | Open |

## 3. P2 — Blocking a module

| ID | Question | Module | Recommended default | Owner | Status |
| -- | -------- | ------ | ------------------- | ----- | ------ |
| Q-002 | Must applicants have an account before applying for membership? | Membership | ~~Yes — sign in to apply (A-003)~~ **Answered 2026-10-03: no account; the account is created when the application is accepted** ([ADR-013](./ADR-013-accounts-for-members-only.md)) | Owner | Answered |
| Q-011 | Intake cycle details: frequency (once a year? more?), duration, who opens/closes it, eligibility criteria, capacity limit, required fields (phone?), extra questions per cycle | Membership | Configurable per cycle; leader manages; phone optional; no capacity unless set | Leadership | Open |
| Q-012 | Does membership expire (renew each cycle) or last until ended? Can rejected applicants re-apply next cycle? | Membership/Members | Lasts until ended; re-application allowed | Leadership | Open |
| Q-013 | Who reviews applications? Do applicants choose a preferred committee? Do committee heads take part? | Membership | Leader decides; preferred committee optional; heads may view for recommendation | Leadership | Open |
| Q-026 | How many existing members/registrations are in production? Do we have members' emails for the claim flow? What happens to unclaimed legacy profiles? | Members/migration | Import all; send claim links; keep visible 6 months then hide unclaimed | Leadership + tech lead | Open |
| Q-005 | Who can create events, and who approves/publishes them? Can events be community-wide (no committee)? | Events | Committee roles create; head submits; community leader approves; add a "Leadership" pseudo-committee for community-wide events | Leadership | Open |
| Q-009 | Can non-members register for events? Are there members-only events? | Registrations | Public by default; optional members-only per event | Leadership | Open |
| Q-018 | Does every event require manual registration approval, or is it per event? | Registrations | Per event; default "requires approval" (current practice) | Leadership | Open |
| Q-029 | Are capacity limits and a waitlist needed? | Registrations | Optional capacity; waitlist optional per event | Leadership | Open |
| Q-019 | Should attendance be recorded? Per day for multi-day camps? Is attendance a prerequisite for certificates? | Registrations | **Answered 2026-10-02 by stakeholder direction ([ADR-012](./ADR-012-event-model-and-wizard-from-kfucs.md))**: follow KFUCS — one attendance session per scheduled day, QR/online/manual check-in, finalization before completion | Leadership | Answered |
| Q-028 | Should rejection emails be sent, and with what wording (current text claims limited seats)? | Notifications | Send a neutral, kind rejection email without asserting a reason | Leadership | Open |
| Q-006 | Who can write, review and publish articles? Can non-committee members submit? | Articles | Committee roles write; head/deputy publishes; members may submit drafts later | Leadership | Open |
| Q-033 | Public label: "ثريد/Thread" or "مقال/Article"? Can guests (non-users) be credited as authors? Can committees be the byline? | Articles | One label "ثريد" in Arabic, "Article" in English (to confirm); allow committee and guest bylines | Leadership | Open |
| Q-035 | Is English content mandatory for events and articles, or optional with Arabic fallback? | Events/Articles | Optional; Arabic required | Leadership | Open |
| Q-040 | Confirm the event types. | Events | KFUCS set (workshop, bootcamp, hackathon, meeting) + meetup, talk (ADR-012) | Leadership | Open |
| Q-007 | What member information is public? Is the directory opt-in? Can founders/leaders see members' contact details? | Members/Privacy | Opt-in directory; email/phone never public; contact data visible to leader/admin only | Leadership | Open |
| Q-030 | Can members edit their own profile freely, or are edits reviewed? | Members | Free editing of profile fields; status/placement not editable | Leadership | Open |
| Q-031 | Privacy obligations: privacy notice text, consent, retention periods, account deletion, breach-notification responsibilities under PDPL; who is the privacy contact? | Security/Privacy | Adopt proposed retention table; obtain guidance before launch | Leadership | Open |
| Q-032 | What exactly may founders (and the advisor) see or do? Should anyone besides system admins read the audit log? | Access/Reports | Read-only oversight (reports, drafts visibility); audit log admins only | Leadership | Open |

## 4. P3 — Later or refining

| ID | Question | Recommended default | Status |
| -- | -------- | ------------------- | ------ |
| Q-008 | Which statistics do leadership and committees need? Any public statistics? | Metric catalogue in [reporting model](../03-business-domain/reporting-model.md); public totals only | Open |
| Q-015 | Should the vision remain AI-focused or be broadened to all technology tracks? | Leadership decision | Open |
| Q-016 | Confirm the proposed goal targets ([goals](../00-product/goals.md)). | As proposed | Open |
| Q-020 | Should the platform issue attendance certificates, and at what attendance threshold? | Model adopted from KFUCS (ADR-012) behind a setting; default off until answered; KFUCS threshold 70 % | Open |
| Q-021 | Real partners list and who manages it? | Simple partners table in Phase 4 | Open |
| Q-022 | Is member-to-member contact needed? Through what channel? | No; link to member's public social profiles only | Open |
| Q-023 | Global site search, or per-list filtering only? | Per-list filtering | Open |
| Q-034 | Do some events need registration questions (e.g., experience level)? | Not in v1.0.0 | Open |
| Q-036 | Can an event be co-organized by multiple committees? | Single owner committee + optional "co-hosts" display later | Open |
| Q-037 | Is privacy-friendly analytics wanted (page views without personal data)? | Vercel Web Analytics (cookieless) if allowed | Open |
| Q-041 | Is there a master brand kit (vector logos, official colors)? Which green is canonical across web and email? | Design & Identity committee provides SVGs; web palette canonical | Open |
| Q-042 | Arabic UI: Gregorian or Hijri dates? Western or Arabic-Indic digits? | Gregorian, Western digits | Open |
| Q-043 | Policy on AI coding assistants in SDC development? | Allowed with the same review rules as human code | Open |
| Q-044 | Should the site follow the OS dark/light preference when the user has not chosen? | Keep dark default (brand) | Open |

## 5. Assumptions

Temporary working assumptions used to proceed. Each must be confirmed or replaced by the linked question's answer.

| ID | Assumption | Linked | Review by |
| -- | ---------- | ------ | --------- |
| A-001 | The audience is primarily Arabic-speaking in Saudi Arabia; Arabic is default. | — | Phase 1 |
| A-002 | The community leader acts as product owner until Q-001 is answered. | Q-001 | Phase 0 exit |
| A-003 | Applicants need an account to apply. | Q-002 | Phase 3B |
| A-004 | Events are free; online by default; in-person/hybrid supported. | — | Phase 3A |
| A-005 | A person may hold several positions and belong to several committees at once. | Q-003, Q-004 | Phase 2 |
| A-006 | One `committees` table (home "sections" = committees); "track" = technical specialization lookup. | Q-004 | Phase 2 |
| A-007 | Event registrations require approval by default (current practice). | Q-018 | Phase 3A |
| A-008 | The remote project `sdc-members` is production. | Q-025 | Phase 0 |
| A-009 | The Design & Identity committee owns brand assets and design-token decisions. | Q-041 | Phase 1 |
| A-010 | Scale: hundreds to low thousands of users, tens of events per year — free tiers are sufficient. | Q-017 | Each milestone |
