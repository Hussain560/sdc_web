# Event Detail — `/events/[id]` → `/events/[slug]`

`app/events/[id]/page.tsx` + `event-details.css`. Hardcoded content per id (1–6); unknown ids fall back to event 2. Registration writes to `event_registrations` and calls the `send-registration-email` Edge Function.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ BANNER 164px          الرئيسية › الفعاليات › ورشة Google AI Studio            [ تسجيل ]   │
│                                                              ورشة Google AI Studio  (h1)   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                           ما هو المجتمع السعودي للمطورين  │
│  المجتمع السعودي هو مجتمع تقني غير ربحي …  (repeated "about SDC" paragraph)               │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│  SIDEBAR 340px                    │  MAIN 1005px                                           │
│  ┌──────────────────────────────┐ │  ┌───────────────────────────────────────────────────┐ │
│  │ الفئة المستهدفة               │ │  │ 📋 المهام والمسؤوليات:                              │ │
│  │ طلاب، خريجون، موظفون          │ │  │ • الحضور والالتزام بوقت الورشة.                     │ │
│  │ الموقع                        │ │  │ • المشاركة الفعالة أثناء التطبيق العملي.            │ │
│  │ أونلاين  (link when map)      │ │  │ • …                                                │ │
│  │ تاريخ الفعالية                │ │  └───────────────────────────────────────────────────┘ │
│  │ 5/8/2026                      │ │  ┌───────────────────────────────────────────────────┐ │
│  │ مدة الفعالية                  │ │  │ 📋 الشروط والمعايير                                 │ │
│  │ غير محدد                      │ │  │ • لا يوجد.                                         │ │
│  │ الجوائز                       │ │  └───────────────────────────────────────────────────┘ │
│  │ شهادة حضور                    │ │  ┌───────────────────────────────────────────────────┐ │
│  │ الأسئلة الشائعة               │ │  │ 📋 المخرجات :                                      │ │
│  │ تتوفر شهادة حضور بعد…         │ │  └───────────────────────────────────────────────────┘ │
│  │ الهاتف                        │ │  ┌───────────────────────────────────────────────────┐ │
│  │ البريد الالكتروني             │ │  │ 📋 الفرص والمزايا :                                 │ │
│  │ sdcommunity.sa@gmail.com      │ │  └───────────────────────────────────────────────────┘ │
│  │ ───────────────────────────── │ │   detail cards: radius 16, padding 26, gap 24          │
│  │ حسابات التواصل الإجتماعي       │ │                                                        │
│  │ [𝕏] [in] [◎] …               │ │                                                        │
│  └──────────────────────────────┘ │                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)

```
│ banner: breadcrumb · [      تسجيل      ] (full width) · title │
│ about paragraph                                              │
│ detail cards (stacked)                                       │
│ sidebar card (after the main cards)                          │
```

### Registration dialog (signed in)

```
┌────────────────────────────────────────┐
│                                     ✕  │
│               ( ✓ )                    │
│       تأكيد التسجيل في الفعالية         │
│        ورشة Google AI Studio           │
│ سيتم التسجيل بالبيانات التالية:         │
│ الاسم:   «full name or زائر»            │
│ البريد:  «email»                        │
│        [ تأكيد التسجيل ]  [ إلغاء ]      │  ← confirm shows "جاري الإرسال..." while sending
└────────────────────────────────────────┘
```

### "Event ended" dialog

```
┌──────────────────────────────┐
│                           ✕  │
│        انتهت الفعالية         │
│  «explanation text»           │
│          [ حسنًا ]            │
└──────────────────────────────┘
```

---

## 2. Layout rules (CURRENT — keep)

- **Banner:** the *تسجيل* capsule sits in the banner's top row at the inline end. It turns into *تم التسجيل* (`.registered`) after a successful registration.
- **Two-column body:** main cards (1005px) at the inline start, sidebar (340px) at the inline end. On mobile the main cards come first.
- **Sidebar:** label/value pairs (`h4` + `p`); the location becomes a link when there is a map URL.
- **Detail cards:** a 📋 icon + title with a colon, then a bullet list.
- **Dialogs:** centered card, overlay click closes, ✕ at the inline end.

## 3. States

| State | CURRENT | TARGET (same look) |
| ----- | ------- | ------------------ |
| Signed out → *تسجيل* | Redirect to `/login?redirect=/events/<id>` | Same, with the locale prefix |
| Signed in → *تسجيل* | Confirm dialog → insert → email | Same dialog. The server function `register_for_event` checks phase, seats, audience and duplicates. On success the banner button shows the **registration status chip** instead: قيد المراجعة / مقبول / قائمة الانتظار / مرفوض (same capsule shape; tones from [00-data-model-reference §2](../INTERNAL-SCREENS/00-data-model-reference.md#2-event-registration)) |
| Already registered | `isRegistered` → *تم التسجيل* | Status chip + *إلغاء التسجيل* text link (before the event) |
| Ended | "Event ended" dialog on click | The banner shows a disabled *منتهي* capsule; no dialog needed |
| Registration closed / full | Not possible | Disabled capsule *التسجيل مغلق* / *اكتمل العدد* (+ *انضم لقائمة الانتظار* when the waitlist is on) |
| Members-only (**Q-009**) | — | Non-members see a disabled capsule *للأعضاء فقط* + a link to `/join` |
| Accepted + event day | — | Banner capsule *تسجيل الحضور* → [check-in](./12-new-public-pages.md#2-event-check-in-eventsslugcheck-in) while a session is open (ADR-012) |
| Accepted | — | A sidebar item **رابط المجموعة** and (online) **رابط اللقاء**, visible only to the registrant (private details) |
| Loading | Static | Banner + 3 detail-card skeletons + a sidebar skeleton (8 label/value pairs) |
| Unknown slug | Falls back to event 2 (**bug**) | Real 404 ([10-not-found](./10-not-found.md)); old numeric ids redirect to slugs |

### TARGET content blocks (KFUCS model, rendered in the existing detail-card style)

The [event wizard](../INTERNAL-SCREENS/13-event-form.md) adds goals, FAQ and presenters. They render as **additional detail cards using the exact same card component**, gated by `display_config`. No new visual component is introduced.

| Block | Card title | Shown when |
| ----- | ---------- | ---------- |
| Goals | 🎯 أهداف الفعالية | `show_goals` and ≥ 1 goal |
| Presenters | 🎤 المقدّمون — rows of avatar (40px) + name + role, in the members-card style | `show_presenters` and ≥ 1 presenter |
| SDC lists | 📋 المهام والمسؤوليات / الشروط والمعايير / المخرجات / الفرص والمزايا | `show_details` and the list is non-empty |
| FAQ | ❓ الأسئلة الشائعة — question in bold, answer below (replaces the single sidebar FAQ line) | `show_faq` and ≥ 1 item |
| Seats | Sidebar item *المقاعد المتبقية* "12 من 60" | `show_seats_remaining` and seats set |
| Schedule | Sidebar *تاريخ الفعالية* lists every date for *specific dates*, or a range | Always |

Empty lists are **hidden** (today the page shows "لا يوجد.").

## 4. Data

| Item | CURRENT | TARGET |
| ---- | ------- | ------ |
| Event | Inline object per id in the page | `public_events` by `slug` ([events entities](../../05-database/entities/events.md)) |
| Registration | Direct insert from the browser (anon key, open RLS) | `register_for_event()` server action; `event_registrations` |
| Email | Edge Function `send-registration-email` (open relay) | Notifications module + `email_log` ([email architecture](../../04-architecture/email-architecture.md)) |
| Private links | — | `event_private_details` (accepted registrants only) |

## 5. Known issues

- Unknown ids silently show event 2.
- `tel:undefined` is rendered when there is no phone.
- The "about SDC" paragraph is repeated on every event.
- The emoji icons (📋) are text; keep them, but give them `aria-hidden`.
