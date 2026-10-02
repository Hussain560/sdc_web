# Events — Attendance Sessions & Certificates

`/dashboard/events/[id]/attendance` — the KFUCS attendance model ([ADR-012](../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md)). Each scheduled day has one **session**. Accepted registrants check in by **QR**, **online** self check-in, or **manual** marking. Sessions are finalized, then the event's attendance is finalized, which unlocks *Complete event* and certificates.

Related screens:
- **Participant check-in:** `/events/[slug]/check-in` (public layout), §5.
- **QR display:** `/dashboard/events/[id]/attendance/[sessionId]/qr` (full screen), §4.

---

## 1. Blueprint — sessions overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ … › معسكر الأمن السيبراني › الحضور                                              │
│ [ نظرة عامة ] [ التسجيلات ] [ الحضور ] [ السجل ]                                 │
│                                                                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────────────┐ │
│ │ المقبولون 48  │ │ الجلسات 3/5   │ │ متوسط الحضور  │ │ مؤهلون للشهادة 34      │ │
│ │              │ │ مُعتمدة        │ │ 81%          │ │ (الحد 70%)            │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └───────────────────────┘ │
│                                                                                │
│ الجلسات                                                                         │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ اليوم 1 · الأحد ١٥ سبتمبر   (مُعتمدة ✓)   حضر 44/48                [ عرض ] │ │
│ │ اليوم 2 · الاثنين ١٦ سبتمبر (مُعتمدة ✓)   حضر 41/48                [ عرض ] │ │
│ │ اليوم 3 · الثلاثاء ١٧ سبتمبر (مفتوحة ●)   حضر 29/48  [ رمز QR ] [ إغلاق ] │ │
│ │ اليوم 4 · الأربعاء ١٨ سبتمبر (مجدولة)                         [ فتح الجلسة ] │ │
│ │ اليوم 5 · الخميس ١٩ سبتمبر  (مجدولة)                          [ فتح الجلسة ] │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│ ⓘ اعتمد جميع الجلسات ثم «اعتماد حضور الفعالية» لإتاحة الإكمال والشهادات             │
│                                        [ اعتماد حضور الفعالية ] (معطّل: 2 متبقية) │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 2. Blueprint — session detail (manual marking)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ‹ الجلسات   اليوم 3 · الثلاثاء ١٧ سبتمبر   (مفتوحة ●)    [ رمز QR ] [ إغلاق الجلسة ] │
│                                                                                │
│ حضر 29 · لم يحضر بعد 19      QR 22 · أونلاين 4 · يدوي 3                          │
│ [ 🔍 الاسم… ]  [ الكل ▾ ]                                  [ تحديد المحدد كحاضر ] │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐  الاسم              العضوية     الحالة              الطريقة   الوقت        │ │
│ │──────────────────────────────────────────────────────────────────────────│ │
│ │ ☐  سعود محمد          (عضو)       (حاضر ✓)            QR       18:04       │ │
│ │ ☐  نورة سالم          (عضو)       (حاضر ✓)            أونلاين   18:11       │ │
│ │ ☐  خالد عمر           (غير عضو)   [ تسجيل حضور ]        —        —          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ « after finalize: » 🔒 الجلسة مُعتمدة — التصحيح يتطلب صلاحية events.complete ويُسجَّل │
│                                          [ اعتماد الجلسة ] (بعد الإغلاق)          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3. Layout rules

- The tab is visible for `published`/`completed` events to users with `registrations.attendance`. Before the first day it shows an info state, "يتاح تسجيل الحضور في يوم الفعالية", listing the scheduled days.
- **Session status chips:**
  - مجدولة (`scheduled`, neutral)
  - مفتوحة (`open`, accent with a pulsing dot — the dot respects reduced motion)
  - مغلقة (`closed`, warning: "بانتظار الاعتماد")
  - مُعتمدة (`finalized`, success)
- **Session actions:** *Open* is allowed only on the session's own day (organizers may open early with confirmation). *Close* stops self check-in. *Finalize* is allowed only after close; its confirm dialog says how many people will be recorded absent.
- **Rows:** only `accepted` registrations. *Mark present* is a single action (there is no "absent" button). Absence is whatever is not checked in at finalization (KFUCS).
- **Event finalization:** enabled when every session is finalized. Its dialog previews the results: attended / absent / eligible for a certificate at the current threshold.
- **Certificates panel** (shown after event finalization, only if certificates are enabled — **OPEN Q-020**):
  - Counts: issued / sent / failed, with [ إصدار الشهادات ] and [ إعادة إرسال الفاشلة ].
  - Per-row delivery chips.

## 4. QR display (organizer screen)

```
┌──────────────────────────────────────────────┐
│ معسكر الأمن السيبراني — اليوم 3                  │
│                                                │
│              ┌──────────────────┐              │
│              │ ▓▓ ▓ ▓▓▓ ▓ ▓▓    │              │
│              │ ▓ QR (rotates)  ▓│              │
│              │ ▓▓▓ ▓ ▓▓ ▓▓▓ ▓   │              │
│              └──────────────────┘              │
│   امسح الرمز لتسجيل حضورك · يتجدد كل 30 ثانية      │
│   حضر الآن: 29 / 48                              │
│                                  [ إنهاء العرض ] │
└──────────────────────────────────────────────┘
```

- Full screen, high contrast (light canvas even in the dark theme, so projectors scan reliably). The token rotates every 30 seconds (KFUCS); the live count is polled every 10 seconds.

## 5. Participant check-in (`/events/[slug]/check-in?t=…`)

- Signed in and accepted, with the session open:
  - With a valid token → success card "تم تسجيل حضورك — اليوم 3 ✓".
  - Without a token (online events) → [ تسجيل حضوري ] while the session is open.
- Already checked in → a neutral card "حضورك مسجّل مسبقًا". The check-in is idempotent.
- Not accepted, session closed, or token expired → an explanatory card with no technical wording.
- Not signed in → sign-in, then return to this URL with the token kept.

## 6. States

| State | Behaviour |
| ----- | --------- |
| Loading | 4 stat tiles + list skeleton (5 rows); session detail uses the table skeleton (8 rows, 5 columns) |
| Empty | "لا يوجد مقبولون في هذه الفعالية" |
| Live updates | Open-session counts refresh every 10 seconds; rows that change highlight briefly (reduced motion: no highlight) |
| Finalized | Read-only, with a lock banner; correction requires `events.complete` and a reason (audited) |

## 7. Data & permissions

- **Actions:**
  - Sessions: `open_session`, `close_session`, `finalize_session`.
  - Marking: `record_attendance` (manual), `check_in` (participant).
  - Event: `finalize_event_attendance`.
  - Certificates: `issue_certificates`, `resend_certificates`.
- **Permissions:** `registrations.attendance` in scope (open/close/mark); `events.complete` (finalize the event, corrections, certificates).
- **Percentage:** `attendance_percent()` is the only formula ([events entities §7](../../05-database/entities/events.md#7-attendance_records)).
- **Requirements:** FR-REG-006; reports use attendance rates ([reporting model](../../03-business-domain/reporting-model.md)).
