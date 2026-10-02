# Events — Registrations Review

`/dashboard/events/[id]/registrations` (per event) and `/dashboard/registrations` (cross-event queue in scope). Replaces the hardcoded `/committee` page: **scoped** to the reviewer's committees, member badge from the member record (not name matching), bulk decisions, email delivery status.

---

## 1. Blueprint — per event

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ … › ورشة Next.js › التسجيلات                                                          │
│ [ نظرة عامة ] [ التسجيلات 73 ] [ الحضور ] [ السجل ]                                      │
│                                                                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   السعة               │
│ │ قيد المراجعة│ │ مقبول     │ │ انتظار    │ │ مرفوض     │ │ ملغى     │   48 / 60  ▓▓▓▓▓▓▓░   │
│ │   21     │ │   48     │ │   2      │ │   1      │ │   1      │   12 مقعدًا متبقيًا    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
│                                                                                        │
│ [ 🔍 الاسم أو البريد… ] [ الحالة: قيد المراجعة ▾ ] [ العضوية: الكل ▾ ]   [ ⤓ تصدير CSV ] │
│                                                                                        │
│ ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐  الاسم                         العضوية      سُجل في        الحالة       البريد     ⋮ │ │
│ │──────────────────────────────────────────────────────────────────────────────────│ │
│ │ ☑  سعود محمد                     (عضو)       ٣ أكت ١٠:١٢   (قيد المراجعة)  —         ⋮ │ │
│ │    saud@example.com                                                               │ │
│ │ ☑  أحمد علي                      (غير عضو)   ٣ أكت ١١:٤٠   (قيد المراجعة)  —         ⋮ │ │
│ │    ahmed@example.com                                                              │ │
│ │ ☐  نورة سالم                     (عضو)       ٢ أكت ٠٩:٠١   (مقبول)       ✓ أُرسل     ⋮ │ │
│ │ ☐  خالد عمر                      (غير عضو)   ١ أكت ٢٢:١٥   (مقبول)       ⚠ فشل ↻     ⋮ │ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│ │ تم تحديد 2     [ قبول ] [ قائمة انتظار ] [ رفض ]                    [ إلغاء التحديد ] │ │  ← bulk bar
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Bulk decision dialog

```
        ┌──────────────────────────────────────────────────┐
        │ قبول 2 من التسجيلات                            ✕ │
        │ ورشة Next.js · سيتبقى 10 مقاعد بعد القبول          │
        │ سيصل لكل مقبول بريد تأكيد مع رابط اللقاء.          │
        │ ملاحظة داخلية (اختياري) [                      ]   │
        │                [ تراجع ]   [ قبول وإرسال البريد ]   │
        └──────────────────────────────────────────────────┘
```

### Registrant drawer (row click)

```
┌────────────────────────────────────────────┐
│ سعود محمد                                ✕ │
│ saud@example.com · (عضو منذ 2025)            │
│ ──────────────────────────────────────── │
│ الحالة         (قيد المراجعة)                │
│ سُجل في        ٣ أكتوبر ٢٠٢٦ ١٠:١٢ م          │
│ ── السجل ──                                 │
│ ٣ أكت  تسجيل                                │
│ ── البريد ──                                │
│ registration.received   ✓ أُرسل ٣ أكت         │
│ ──────────────────────────────────────── │
│ [ رفض ]  [ انتظار ]  [ قبول ]                │
└────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **Summary strip** — 5 clickable count tiles (filter by status) + capacity meter (accepted/capacity; warning ≥ 90%, danger at 100%). No capacity → "بدون حد للسعة".
- **Filters** — search, status, membership (member / non-member), date range; URL-synced. Default filter for reviewers: `pending`.
- **Table** — selection checkbox (only with `registrations.review`), name + email (`dir="ltr"` muted), **membership badge from `was_member`/current member record**, registered-at (relative + tooltip absolute), status badge, email status (sent ✓ / failed ⚠ with *Retry* / not sent —), kebab (accept, waitlist, reject, cancel registration, view).
- **Bulk bar** — slides up from the bottom when ≥ 1 row selected; shows count; actions limited to transitions valid for **all** selected rows (otherwise disabled with reason "تحديد يحتوي حالات غير متوافقة").
- **Capacity guard** — *Accept* disabled when selection exceeds remaining seats; dialog states remaining seats after acceptance.
- **Reversal** — accepting a rejected or rejecting an accepted registration opens a warning dialog ("سبق إرسال بريد القبول لهذا المشارك").
- **Export** — `registrations.export`; exports current filter as CSV (name, email, status, member, registered at); writes an audit entry; filename `registrations-<slug>-<date>.csv`.
- **Cross-event queue** (`/dashboard/registrations`) — same table with an *Event* column and event filter; defaults to `pending` across the user's scope.
- Mobile: rows become cards with a checkbox and inline action buttons.

## 3. States

- **Loading** — summary tiles skeleton (5) + list skeleton (8 rows).
- **Empty** — "لا توجد تسجيلات بعد"; for unpublished events: "يبدأ التسجيل بعد النشر".
- **Decision in progress** — buttons show pending; rows lock; on success rows update status and email column ("قيد الإرسال…" → ✓/⚠).
- **Partial email failure** — success toast for decisions + warning toast "تعذر إرسال 1 رسالة — يمكنك إعادة المحاولة" (decision is not rolled back — BR-NOT-002).
- **Concurrency** — if another reviewer took the last seat, the server returns `CAPACITY_REACHED`; dialog shows the error and refreshes counts.

## 4. Data & permissions

- Read: `listRegistrations(eventId, filters)` (RLS scope), `event_registration_counts`, email status from `email_logs`.
- Actions: `decide_registrations(ids, decision, note)`, `cancel_registration(id)`, `retryEmail(logId)`, `exportRegistrations(eventId, filters)`.
- Permissions: `registrations.review` in the event's committee scope (or global); `registrations.export`; email retry with review permission.
- Requirements: FR-REG-003, FR-REG-004, FR-REG-007, FR-NOT-002/003.
