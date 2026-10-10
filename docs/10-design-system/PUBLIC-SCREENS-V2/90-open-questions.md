# 90 — Open Questions for the Owner and Data Gaps

Hard rule 10: where a choice is the owner's (brand, new content, legal wording), the design asks instead of deciding. Each item has the **default the design assumes** so work can continue, and the page that waits on it.

## 1. Owner decisions

| Id | Question | Default until answered | Blocks |
| -- | -------- | ---------------------- | ------ |
| Q-H1 | The home headline and lede (Arabic first). | The approved tagline as the lede; headline placeholder in design files only | Home hero |
| Q-H2 | Which figures may appear publicly (events held, listed members, committees, certificates issued), and are they computed live or set by hand in settings? | Computed live from public views; a figure without a public source is hidden; the row is hidden with fewer than 3 | Home stats, About figures |
| Q-H3 | The "why join" benefits (4 for members, 4 for partners). | Section hidden until supplied | Home ⑤, Join |
| Q-H4 | The FAQ questions and answers (home, join, events). | Section hidden until supplied | Home ⑨, Join, `/faq` |
| Q-A1 | Public wording of vision, mission and values (the product docs are internal drafts). | Use `vision-mission.md` once the owner confirms it | About |
| Q-C1 | Committee icons and one-line purposes for the committees index. | Default icon, description from `committees` | `/committees` |
| Q-E4 | "Closes soon" thresholds: under 48 h to the deadline, or ≤ max(3, 10%) seats left? | Both, as written | Event states S3 |
| Q-E7 | Should event covers be **required** to publish? | Recommended yes; the CSS fallback otherwise | Wizard, cards |
| Q-021 | Partners: who is listed, with which logos and approval? | Partner strip hidden while `partners` has no active rows | Home ⑦ |
| Q-023 | Search page: build it now or later? | Later; the search icon is hidden until then | Header |
| Q-031 | Privacy notice legal review. | The notice shows "awaiting legal review" | `/privacy` |
| Q-041 | SVG logo masters, a transparent light wordmark, a light vertical lockup. | Existing rasters; the light wordmark is placed on mint grounds only | Header, footer, brand kit |
| Q-044 | Follow the OS theme when the visitor hasn't chosen? | No: dark by default | Theme |
| Q-S1 | Instagram account (the setting holds the placeholder `https://instagram.com`). | Hidden until a real URL is set | Footer |
| Q-S2 | Dates for the redesign sprints (14–16) relative to launch (Sprint 13). | After launch, as planned in the sprint plans | Sprint plan |
| Q-S3 | Approval of new visual baselines once each page lands (they will all change). | Baselines are only updated after the owner approves | CI |

## 2. Data gaps

What the design needs and the schema doesn't have yet. Each one is a small migration or a settings change, scheduled in the [sprint plans](../../99-project-management/sprints/sprint-14-design-system-v2-foundation/plan.md). None of them changes who can see what without the owner's approval.

| Id | Gap | Proposed change | Needed by |
| -- | --- | --------------- | --------- |
| Q-E1 | A per-day place for multi-day events | `event_dates.location_ar`, `location_en` (nullable; falls back to the event's) | Event agenda |
| Q-E2 | Agenda items inside a day | `event_dates.agenda jsonb` (`[{time, title_ar, title_en}]`, ≤ 20) or a later `event_sessions` table | Event agenda (later; day cards ship without it) |
| Q-E3 | "What to bring" | A new key `details.what_to_bring` ({ar[], en[]}) in the wizard; no migration | Event page |
| Q-E5 | Certificate settings are private | Make `certificates_enabled` and `certificate_threshold` public settings (`is_public = true`) | Event page certificate rule |
| Q-E6 | Presenter photos for presenters who are members (profile avatars aren't public) | Expose `avatar_path` for presenters only, through a `public_event_presenters` view | Event speakers |
| Q-M1 | Per-field directory consent | `members.show_university`, `show_track`, `show_links` (default false for new, true for already-listed members — owner to confirm) and the view filters by them | Directory, profile |
| Q-M2 | Directory photos | `members.photo_path` + `show_photo` (opt-in), exposed in `member_directory` | Directory, profile |
| Q-M3 | "Events I took part in" on profiles | `members.show_participation` (opt-in, default false) + a view of presenter roles and attended events limited to it | Profile |
| Q-M4 | Committee membership is not in the directory | Expose committee slugs for listed members in `member_directory` (public roles only, or all members — owner decides) | Directory committee filter, profile |
| Q-CE1 | Certificate revocation | A `revoked_at`/`revoked_reason` on `certificates`, or no revocation (owner) | Certificate page |
| Q-H2 | Public counts | A `public_stats` view (counts only, no rows) | Home, About |
