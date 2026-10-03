# Events — Detail, Review & Lifecycle Actions

`/dashboard/events/[id]` — the internal record of one event. Every lifecycle transition starts here: submit, approve, request changes, withdraw, cancel, complete. Tabs lead to registrations and attendance.

---

## 1. Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › الفعاليات › ورشة Next.js والذكاء الاصطناعي                               │
│                                                                                      │
│ ورشة Next.js والذكاء الاصطناعي   (بانتظار الاعتماد)        [ طلب تعديلات ] [ اعتماد ونشر ] │
│ Next.js & AI Workshop · لجنة الذكاء الاصطناعي · ورشة                                ⋮  │
├────────────────────────────────────────────────────────────────────────────────────┤
│ ● مسودة ──────── ◉ بانتظار الاعتماد ──────── ○ منشورة ──────── ○ مكتملة                │
│   ١ أكتوبر         ٢ أكتوبر · هيا المالكي                                               │
│   هيا المالكي       بانتظار: قائد المجتمع · منذ ٥ ساعات                                  │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [ نظرة عامة ] [ التسجيلات 0 ] [ الحضور ] [ السجل ]                                      │
├──────────────────────────────┬─────────────────────────────────────────────────────┤
│ ── معلومات ──                 │  ┌──────── معاينة الصفحة العامة ──────────────────┐ │
│ النوع        ورشة              │  │ [cover 16:9]                                    │ │
│ النمط        أونلاين           │  │ ورشة Next.js والذكاء الاصطناعي                  │ │
│ الموعد       ١٠ نوف · ٦–٨ م    │  │ المهام والمسؤوليات • …                           │ │
│ التسجيل      ١ نوف ← ٩ نوف     │  │ الشروط والمعايير • …                             │ │
│ السعة        60 · موافقة ✓     │  └────────────────────────────── [ فتح المعاينة ↗ ] ┘ │
│ الجمهور      عام               │                                                     │
│                              │  ── اكتمال المحتوى ──                                 │
│ ── تفاصيل خاصة 🔒 ──          │  ✓ العنوان (ع/EN)   ✓ الوصف   ⚠ لا توجد صورة غلاف       │
│ رابط اللقاء  meet.google…  ⧉  │  ✓ الموعد          ✓ التفاصيل ⚠ الإنجليزية ناقصة في 2 │
│                              │                                                     │
│ ── التواصل ──                 │                                                     │
│ sdcommunity.sa@gmail.com     │                                                     │
└──────────────────────────────┴─────────────────────────────────────────────────────┘
```

### Request-changes dialog

```
        ┌───────────────────────────────────────────────┐
        │ طلب تعديلات على الفعالية                    ✕ │
        │ ورشة Next.js والذكاء الاصطناعي                 │
        │ ستعود الفعالية إلى اللجنة للتعديل وإعادة الإرسال. │
        │                                               │
        │ الملاحظات *                                    │
        │ [                                           ]  │
        │ [                                           ]  │
        │ ⓘ تظهر للجنة وتُحفظ في سجل الفعالية. 10 أحرف على الأقل │
        │                                               │
        │          [ إلغاء ]     [ إرسال الملاحظات ]       │
        └───────────────────────────────────────────────┘
```

### Cancel-event dialog (published)

```
        ┌───────────────────────────────────────────────┐
        │ إلغاء الفعالية                              ✕ │
        │ سيتم إشعار 48 مسجلًا (مقبول/قيد المراجعة/انتظار) │
        │ سبب الإلغاء * [                              ]  │
        │ ⓘ يظهر السبب في الصفحة العامة وفي رسالة الإشعار   │
        │       [ تراجع ]      [ إلغاء الفعالية ]  (danger) │
        └───────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **Header** — title (h1, active locale) + other-language title muted below with committee and type; status badge; **primary actions at the inline-end** from the [allowed-action matrix](./00-data-model-reference.md#14-allowed-actions-by-status) ∩ permissions:
  - Approver on `pending_review`: *Request changes* (outline) + *Approve & publish* (primary).
  - Committee head on `draft`/`changes_requested`: *Edit* + *Submit for review*.
  - Published: *Edit* + kebab (*Cancel event* danger, *Complete* when ended, *View public page ↗*).
  - Actions the user cannot perform are **omitted**; actions blocked by state are disabled with a reason (e.g., *Complete* before `ends_at`).
- **Lifecycle timeline** — horizontal rail: Draft → Pending review → Published → Completed (Cancelled renders a red terminal node). Done nodes accent-filled with date + actor; current node ringed; waiting line "بانتظار: {role} · منذ {age}" turns warning after 3 days (Proposed). Scrolls horizontally on mobile.
- **Tabs** — Overview · Registrations (count) · Attendance (published/ended only) · History (audit trail). Tabs hidden without permission (`registrations.review`, `registrations.attendance`).
- **Overview** — left rail (sticky, 320px) with facts, 🔒 private details (meeting link, organizer notes — only with `events.edit`), contact. Main: **public page preview** (scaled card of the public event page) and a **content completeness checklist** (helps reviewers; warnings don't block submit except required fields).
- **Changes-requested banner** — warning `Alert` above the tabs with reviewer, date and note, plus *Edit & resubmit*.
- **History tab** — append-only table: time, action, actor, transition (`from → to`), note. Newest first.
- **RTL** — the facts rail sits at the **inline-start** (reading start) in both directions; the timeline runs inline-start → inline-end; emails and URLs stay `dir="ltr"`.

## 3. States

- **Loading** — detail skeleton §2.2 (header, 4-node timeline, rail, preview block).
- **Approve success** — status and timeline update; toast "تم نشر الفعالية"; public pages revalidated.
- **Invalid transition (stale tab)** — toast with domain message ("تمت مراجعة هذه الفعالية بالفعل"), page refreshes state.
- **Not found / out of scope** — 404 view inside the shell.
- **Cancelled / completed** — action bar empty except *View public page*; muted banner with who/when/reason.

## 4. Data & permissions

- Read: `getEvent(id)` (+ private details when permitted), `getEventHistory(id)` from `audit_logs`.
- Actions: `transition_event(id, action, note)` — submit · approve · request_changes · withdraw · cancel · complete.
- Notifications: cancel → `event.cancelled`; published edits of time/place → `event.changed`.
- Permissions: `events.view_drafts` (view non-public), `events.edit`, `events.submit`, `events.approve` (*Q-005*), `events.cancel`, `events.complete`.
- Requirements: FR-EVT-002, FR-EVT-005, FR-EVT-006.
