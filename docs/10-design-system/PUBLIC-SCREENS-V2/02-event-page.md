# 02 — Event Page `/events/[slug]` ★ (the most important page)

**Purpose.** In five seconds a visitor knows **what, when, where, how many seats are left, and what to do**, and can register in one dialog without an account (ADR-013). Everything else on the page answers the questions that come after deciding.

## 1. Wireframe — desktop (1440, RTL)

```text
╭─ header ─────────────────────────────────────────────────────────────────────────────────────╮
 الرئيسية › الفعاليات › ورشة بناء واجهات متجاوبة                                  breadcrumb
┌───────────────────────────────────────────────────────────────┐  ┌── SIDE PANEL 360 (sticky) ──┐
│ ( ✓ التسجيل مفتوح )  ( ورشة )  لجنة التقنية ←                    │  │ ┌─────────────────────────┐ │
│                                                               │  │ │ cover 16:9 (M-12)        │ │
│ ورشة بناء واجهات متجاوبة بـ React                     t-h1 ≤24ch │  │ └─────────────────────────┘ │
│ ‹summary_ar — one or two lines›                        t-lede   │  │ 📅 الثلاثاء 14 أكتوبر 2026   │
│                                                               │  │ 🕒 6:00 – 8:00 م            │
│ 📅 14 أكتوبر 2026   🕒 6:00 – 8:00 م   📍 الأحساء · جامعة…   👥 12  │  │ 📍 الأحساء · جامعة الملك فيصل │
│                                        مقعداً متبقياً          │  │    افتح في الخرائط ↗          │
│ ( سجّل الآن )   أضف إلى التقويم   مشاركة                          │  │ 👥 12 من 60 مقعداً متبقياً     │
└───────────────────────────────────────────────────────────────┘  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░          │
 ┌ in-page nav (sticky under header) ──────────────────────────┐   │ ( سجّل الآن )   lg, full      │
 │ عن الفعالية · البرنامج · المتحدثون · لمن هذه الفعالية · المكان  │   │ يُغلق التسجيل 12 أكتوبر       │
 │ · ماذا تحضر · الأسئلة الشائعة                                  │   │ 🏅 شهادة حضور لمن يحضر 70%   │
 └─────────────────────────────────────────────────────────────┘   │    من الجلسات أو أكثر.        │
 ●● عن الفعالية                                                      │ ───────────────────────── │
 description (t-body, ≤ 70ch)                                       │ أضف إلى التقويم · مشاركة    │
                                                                    │ أسئلة؟ events@… (contact)   │
 ●● البرنامج                                                         └─────────────────────────────┘
 ┌ day card ───────────────────────────────────────┐
 │ [14 أكتوبر]  اليوم 1 · 6:00 – 8:00 م · ‹place›    │   one card per event_dates row
 └──────────────────────────────────────────────────┘
 ●● المتحدثون
 (◯ name · title · link) (◯ …) (◯ …)                       event_presenters, by sort_order
 ●● لمن هذه الفعالية
 goals list (✓) │ audience list (•)                          two columns ≥ md
 ●● المكان
 📍 location text · افتح في الخرائط ↗ · (online: "الرابط يُرسل للمسجّلين المقبولين")
 ●● ماذا تحضر                                               (data gap Q-E3)
 ●● الأسئلة الشائعة   accordion
 ●● المهام والمتطلبات والمزايا   (details lists, accordion groups, only if show_details)
──────────────────────────────────────────────────────────────────────────────────────────────
 ●● فعاليات ذات صلة                                      ( كل الفعاليات ← )
 [event card] [event card] [event card]
╭─ footer ─╮
```

## 2. Wireframe — phone (360)

```text
[header 56]
← الفعاليات                                   (breadcrumb: parent only)
[cover 16:9, full bleed inside 16px gutter]
( ✓ التسجيل مفتوح ) ( ورشة )
ورشة بناء واجهات
متجاوبة بـ React                               t-h1 32px
summary
┌ facts (2 × 2) ─────────────────┐
│ 📅 14 أكتوبر   │ 🕒 6–8 م        │
│ 📍 الأحساء     │ 👥 12 متبقياً   │
└────────────────────────────────┘
🏅 certificate rule (one line)
أضف إلى التقويم · مشاركة
[ chips: عن · البرنامج · المتحدثون · … ]   in-page nav, scrolls sideways inside itself
sections stacked …
related events (stacked cards)
[footer]
┌──────────────────────────────────────┐  STICKY ACTION BAR (fixed, block-end)
│ 12 مقعداً متبقياً      ( سجّل الآن )   │  64px + safe area, --surface 95% + blur
└──────────────────────────────────────┘
```

## 3. Sections

| Section | Shown when | Components | Content |
| ------- | ---------- | ---------- | ------- |
| Hero | Always | StatusPill, Badge (type), TextLink (committee), DateChip inline, Button | Title, summary, facts, the state's primary action, add to calendar, share |
| Side panel / action bar | Always (panel ≥ `lg`, bar < `lg`) | Card, Progress (seats), Button | Cover, the full date list, time, place + map link, seats, primary action, the deadline, the certificate rule, contact |
| About | `description` exists | Prose | `description_ar/en` |
| Agenda (البرنامج / Agenda) | ≥ 2 dates, or day details exist | Timeline | **One card per `event_dates` row**: "اليوم 1 / Day 1", date, its own `starts_at–ends_at` (falls back to the event time), its own place (data gap Q-E1, falls back to the event place). The current day gets "جارية الآن / Happening now" while the event runs. |
| Speakers | `display_config.show_presenters` and ≥ 1 presenter | Avatar 56 + name + title + link | `event_presenters` by `sort_order`; role label (مقدّم/Presenter, مرشد/Mentor, محكّم/Judge, مضيف/Host). Guest photo `guest_photo_path` or initials. |
| For whom (goals and audience) | Goals or audience exist (`show_goals`) | Two lists | Goals with `Check` icons; audience from `details.target_audience` |
| Place | `in_person` or `hybrid` | Text + external link | `location_*`, "افتح في الخرائط / Open in maps" → `map_url`. **No embedded map** (privacy, CSP). Online: "يصل رابط اللقاء إلى المسجّلين المقبولين قبل الموعد / Accepted registrants get the meeting link before it starts." |
| What to bring | Data exists (Q-E3) | List | `details.what_to_bring` |
| FAQ | `show_faq` and ≥ 1 item | Accordion | `faq[]` |
| Details | `show_details` and any list non-empty | Accordion groups | Responsibilities, requirements, deliverables, benefits (KFUCS lists) |
| Related events | ≥ 1 match | EventCard × 3 | Upcoming published events of the same committee, else the same type; never the current event |

The in-page nav lists only the sections that render. It is a `nav` of anchor links (`aria-label="أقسام الصفحة / On this page"`) with `aria-current` on the section in view.

## 4. Event states

The state comes from `public_events.phase` (derived in the database), `seats_left`, `waitlist_enabled`, `audience`, `requires_approval`, the signed-in member's registration (`my_registrations`), and an open attendance session.

| # | State | Condition | Status pill | Primary action (panel and bar) | Extra |
| - | ----- | --------- | ----------- | ------------------------------ | ----- |
| S1 | Announced | `announced` | neutral `CalendarClock` "يفتح التسجيل قريباً / Registration opens soon" | Disabled "التسجيل يفتح ‹date› / Opens ‹date›" (when `registration_start_at` is known), else no button | "أضف إلى التقويم" stays |
| S2 | Open | `registration_open`, seats left or no limit | success "التسجيل مفتوح / Registration open" | **"سجّل الآن / Register now"** → dialog | Seats bar when `show_seats_remaining` |
| S3 | Closes soon | S2 and (`registration_end_at` < 48 h away **or** `seats_left` ≤ max(3, 10% of seats)) — thresholds Q-E4 | warning `Hourglass` "يُغلق قريباً / Closes soon" | "سجّل الآن" | Line: "يُغلق التسجيل بعد ‹relative› / Closes in ‹relative›" or "بقي ‹n› مقاعد / ‹n› seats left" |
| S4 | Full, waiting list | `seats_left = 0`, `waitlist_enabled`, still open | warning `ListOrdered` "مكتمل · قائمة انتظار / Full · waiting list" | **"انضم لقائمة الانتظار / Join the waiting list"** → the same dialog | "سنراسلك إن توفّر مقعد / We'll e-mail you if a seat opens" |
| S5 | Full | `seats_left = 0`, no waitlist | neutral "اكتملت المقاعد / Full" | Disabled "اكتمل العدد / Full" | Related events get more weight |
| S6 | Registration closed | `registration_closed` | neutral "التسجيل مغلق / Registration closed" | Disabled | |
| S7 | Members only | `audience = members_only` and the viewer isn't an active member | info `UserRound` "للأعضاء / Members only" | "قدّم طلب العضوية / Apply for membership" → `/join` (secondary) | Members signed in see S2–S6 normally |
| S8 | Registered | Signed-in member with a registration | accent `Check` "مسجّل / Registered", or info "قيد المراجعة / Under review", or warning "في قائمة الانتظار / On the waiting list" | "أضف إلى التقويم / Add to calendar" | **Confirmation panel** in place of the action: status, the e-mail it went to, "إلغاء التسجيل / Cancel registration" (ghost, before the event, with a confirm dialog). Accepted + online: the meeting link from `event_private_details`. |
| S9 | Running, check-in open | `in_progress` and an `attendance_sessions` row `open` for today | info `Radio` "جارية الآن / Happening now" | **"سجّل حضورك / Check in"** → `/events/[slug]/check-in?s=…` (for people at the venue the QR does this) | Agenda marks today's day card |
| S10 | Running, no check-in | `in_progress`, no open session | info "جارية الآن" | none | |
| S11 | Finished | `ended` / `completed` | neutral `Flag` "انتهت / Finished" | none | The certificate line becomes "تصل الشهادات بالبريد بعد اعتماد الحضور / Certificates are e-mailed once attendance is approved", then "صدرت الشهادات / Certificates issued". Related: upcoming events. |
| S12 | Cancelled | `cancelled` | danger `CircleX` "أُلغيت / Cancelled" | none | An Alert (warning) at the top of the hero with `cancel_reason`; the facts are struck through visually but keep their text; the dialog can't open |
| S13 | Date to be announced | `start_date` null | neutral | as S1 | "يُعلن الموعد قريباً / Date to be announced" in place of the date |
| — | Loading | Streaming | — | Skeleton button | Hero, panel and two section skeletons |
| — | Not found | Unknown or unpublished slug | — | — | 404 ([11](./11-privacy-and-not-found.md)); old numeric ids redirect to the slug |

**Certificate rule** (panel and phone facts), shown only when `certificate_available` and `certificates_enabled`:
"🏅 تُمنح شهادة حضور لمن يحضر ‹threshold›% من الجلسات أو أكثر، وتصل بالبريد بعد الفعالية." / "🏅 Attend at least ‹threshold›% of the sessions to get a certificate of attendance by e-mail after the event."
`‹threshold›` comes from `site_settings.certificate_threshold` (today 70 and **not public**: data gap Q-E5). For a single-session event: "لمن يحضر الفعالية / to everyone who attends".

## 5. The registration dialog

### 5.1 Form

| Field | Type | Rules |
| ----- | ---- | ----- |
| الاسم الكامل / Full name | text, `autocomplete="name"` | Required, 3–100 characters |
| البريد الإلكتروني / E-mail | email, `dir="ltr"` | Required; the hint is "سنرسل التأكيد إلى هذا البريد / We'll send the confirmation here" |
| رقم الجوال / Mobile | tel, `dir="ltr"`, `inputmode="tel"` | Required; 8–15 digits, `+`, spaces and brackets allowed (the current rule) |
| الجامعة / University | select or text | Optional |
| Consent | checkbox | Required: "أوافق على [سياسة الخصوصية] / I agree to the [privacy notice]" (link opens in a new tab) |
| Honeypot | hidden | Visually hidden, `aria-hidden`, `tabindex="-1"` |

Signed-in members see a short confirm dialog with their name and e-mail pre-filled and read-only, plus the consent line (A-17). Phones (< 768): a **bottom sheet**. Title "التسجيل في ‹event title› / Register for ‹event title›"; under it a one-line summary (date · place). Footer: "سجّل / Register" (primary, lg, full width on phones) + "إلغاء / Cancel" (ghost).

### 5.2 Flow and timing

```text
 [Register] ─press─▶ t0 ──────────────────────────────────────────────▶ t0 + max(1.5 s, server)
                    │ button: spinner + "جارٍ التسجيل… / Registering…"   │ progress bar → 100% (200 ms)
                    │ form inert, close and Esc disabled ("سيُغلق بعد     │ dialog content swaps to the
                    │   اكتمال الإرسال")                                   │ RESULT (same dialog / sheet)
                    │ progress bar (indeterminate) on the dialog top      │ focus → result title
                    │ role=status "جارٍ تسجيلك…"                           │ role=status | role=alert
                    └─ server answers at t1 (any time) ────────────────────┘
```

1. Press "سجّل": client validation first. Field errors stop here (no request, no delay).
2. Valid: **immediately** lock the form, the button and the dialog; start the progress state; send the request.
3. Show the result at `max(t1, t0 + 1500 ms)`. The floor applies to **every** outcome. If the network gives no answer after 15 s, show the "try again" result.
4. The result replaces the form inside the same dialog. The page's state (S8) updates behind it for signed-in members.
5. After a refusal of type "too many attempts", the retry is locked for the server's cooldown (a visible countdown in a `timer` region). The existing 2.5 s client cooldown after errors stays.

### 5.3 Results

| Result | From | Icon / tone | Title | Sentence | Action |
| ------ | ---- | ----------- | ----- | -------- | ------ |
| Registered | status `accepted` | `CircleCheck` success | تم تسجيلك / You're registered | أرسلنا التفاصيل إلى ‹email›. / We sent the details to ‹email›. | أضف إلى التقويم / Add to calendar · تم / Done |
| Under review | `pending` | `Clock` info | استلمنا طلبك / We got your request | سنراسلك على ‹email› بعد مراجعة الطلب. / We'll e-mail ‹email› once it's reviewed. | تم / Done |
| Waiting list | `waitlisted` | `ListOrdered` warning | أنت في قائمة الانتظار / You're on the waiting list | سنراسلك إن توفّر مقعد. / We'll e-mail you if a seat opens. | تم / Done |
| Already registered | `ALREADY_REGISTERED` | `Info` info | أنت مسجّل مسبقاً / You're already registered | هذا البريد مسجّل في الفعالية. تفقّد بريدك للتفاصيل. / This e-mail is already registered. Check your inbox. | تم / Done |
| Event full | `EVENT_FULL`, `CAPACITY_REACHED` | `Users` neutral | اكتملت المقاعد / This event is full | اكتمل العدد قبل وصول طلبك. / It filled up just before your request arrived. | تصفّح الفعاليات / Browse events |
| Closed | `REGISTRATION_CLOSED` | `CalendarX` neutral | أُغلق التسجيل / Registration has closed | انتهت فترة التسجيل لهذه الفعالية. / Registration for this event has ended. | تصفّح الفعاليات / Browse events |
| Too many attempts | `RATE_LIMITED`, `TOO_FAST`, honeypot, fill time | `Timer` warning | محاولات كثيرة / Too many attempts | انتظر قليلاً ثم حاول مرة أخرى. / Please wait a moment and try again. | حسناً / OK (+ countdown) |
| Members only | `MEMBERS_ONLY` | `UserRound` info | هذه الفعالية للأعضاء / This event is for members | التسجيل فيها متاح لأعضاء المجتمع. / Registration is open to community members. | قدّم طلب العضوية / Apply for membership |
| Check your details | `VALIDATION_FAILED`, `CONSENT_REQUIRED` | — | (back to the form with field errors and an error summary) | | |
| Try again | `INTERNAL`, network, timeout | `CircleX` danger | تعذّر التسجيل / We couldn't register you | حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى. / Something went wrong. Please try again. | حاول مرة أخرى / Try again (returns to the filled form) |

"Add to calendar" downloads `/events/[slug]/calendar.ics` (title, dates, place or "Online", the event URL; **no personal data**), with Google Calendar as a second link.

## 6. Check-in page `/events/[slug]/check-in`

The organizer shows the session QR at the venue (dashboard `QrPanel`). Scanning it opens this page with `?s=<session>&t=<token>`. It uses the **auth-style focused layout without the brand panel** (header and footer stay, so it's clearly SDC), a centred `--container-tight` card:

```text
            [mark]
     ورشة بناء واجهات متجاوبة            t-h3
     اليوم 1 · 14 أكتوبر                   muted
  ┌──────────────────────────────┐
  │ البريد الإلكتروني               │      the e-mail used to register (dir=ltr)
  └──────────────────────────────┘
  [        سجّل حضوري          ]      primary, full width
```

| State | Card |
| ----- | ---- |
| Form | As above (signed-in accepted members skip it and are checked in at once) |
| Checked in | `CircleCheck` success · "تم تسجيل حضورك / You're checked in" · the time |
| Already checked in | `Info` · "حضورك مسجّل مسبقاً / You're already checked in" |
| Session not open | `Clock` · "الجلسة غير مفتوحة الآن / This session isn't open" · "يفتح المنظّم تسجيل الحضور وقت الفعالية." |
| Token expired | `RefreshCw` · "انتهت صلاحية الرمز / This code expired" · "امسح الرمز المعروض الآن. / Scan the code on screen again." |
| Not registered / not accepted | `Info` · "لم نجد تسجيلاً مقبولاً بهذا البريد / No accepted registration matches this e-mail" |
| Too many attempts | as the registration result (same 1.5 s floor) |

## 7. Data

| Need | Source |
| ---- | ------ |
| Event, phase, seats | `public_events` by `slug` (`getPublicEvent`) |
| Dates per day | `event_dates` (public read) |
| Speakers | `event_presenters` + public profile name/photo for `profile_id` presenters (gap: profile photos aren't public, Q-E6) |
| Viewer's registration | `my_registrations` (signed in only) |
| Open session | `attendance_sessions` status for today (via the `check_in_public_context` RPC) |
| Certificate rule | `certificate_available`, `site_settings.certificates_enabled` and `certificate_threshold` (gap Q-E5: both are private today) |
| Private links | `event_private_details` (accepted registrants only) |
| Related | `public_events` same `committee_id`, else same `type`, upcoming, limit 3 |
| Register | `register_guest()` (guests) / `registerForEvent()` (members) |

**Data gaps:** a per-day place and agenda items (Q-E1, Q-E2), "what to bring" (Q-E3), the closes-soon thresholds (Q-E4), public certificate settings (Q-E5), presenter profile photos (Q-E6).

## 8. Media

`M-12` event cover (16:9, required for publishing; uploaded per event), `M-13` presenter photos (1:1, optional, initials fallback), `M-14` the default cover for events without one (dot-grid fallback in the meantime).
