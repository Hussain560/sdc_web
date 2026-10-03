# Committee Review (Legacy) — `/committee`

`app/committee/page.tsx`. It is reachable from the header link *لوحة اللجنة* for e-mails in `COMMITTEE_EMAILS`. It is styled entirely with inline styles (hex colours), not the design system. **Retired in Phase 3A**: its function moves to [`/dashboard/registrations`](../INTERNAL-SCREENS/15-event-registrations.md).

---

## 1. Blueprint (CURRENT)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (with لوحة اللجنة active)                                                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ مراجعة تسجيلات الفعاليات                                                                   │
│ «subtitle, grey #888»                                                                      │
│                                                                                            │
│ ورشة Google AI Studio  (12 مسجل)                                                           │
│ ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ الاسم         البريد               النوع       الحالة          الإجراء                │ │
│ │ «name»        «email»              (عضو)       (قيد الانتظار)   [ قبول ] [ رفض ]       │ │
│ │ «name»        «email»              (زائر)      (مقبول)          [ قبول ] [ رفض ]       │ │
│ └──────────────────────────────────────────────────────────────────────────────────────┘ │
│ «next event group…»                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────┘

Not authorized:   غير مصرح لك بالدخول لهذه الصفحة / هذه الصفحة مخصصة لأعضاء اللجنة فقط.
Empty:            لا يوجد أي تسجيلات حتى الآن.
```

## 2. Behaviour (CURRENT)

- It loads **all** registrations from the browser with the anon key, groups them by the event title, and marks each registrant member (عضو) or visitor (زائر) by matching e-mails against `members`.
- *قبول* / *رفض* update the row directly, then call `send-status-email`.
- Chips: member `rgba(0,230,118,.15)` / `#00E676`; visitor amber `#FFC107`; status colours inline.

## 3. Retirement plan

| Step | Phase |
| ---- | ----- |
| Build `/dashboard/registrations` with scoped review, bulk actions and an email log ([15](../INTERNAL-SCREENS/15-event-registrations.md)) | 3A |
| Map the current reviewers to roles (`ACC-004`, **Q-039**) | 2 |
| `/committee` → permanent redirect to `/dashboard/registrations`; remove `COMMITTEE_EMAILS` | 3A |
| Delete the `send-status-email` Edge Function | 3A |
