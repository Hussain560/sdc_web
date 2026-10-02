# Membership — Applications Review

`/dashboard/membership/applications?cycle=<id>` — reviewers process the applications of an intake cycle: filter, read, decide individually or in bulk, export. Acceptance creates the member record atomically and emails the applicant.

---

## 1. Blueprint

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › العضوية › طلبات العضوية                                                  │
│ طلبات العضوية                       الدورة: [ استقبال 2026 (مفتوحة) ▾ ]  [ ⤓ تصدير ]   │
│                                                                                        │
│ [ جديدة 41 ] [ قيد المراجعة 6 ] [ مقبولة 0 ] [ انتظار 0 ] [ مرفوضة 0 ] [ مسحوبة 1 ]      │
│ [ 🔍 الاسم أو البريد ] [ الجامعة ▾ ] [ الحالة الأكاديمية ▾ ] [ المسار ▾ ] [ اللجنة المفضلة ▾ ] │
│                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ المتقدم                 الجامعة / التخصص            المسار      اللجنة المفضلة  قُدم ⋮ │ │
│ │────────────────────────────────────────────────────────────────────────────────────│ │
│ │ ☐ ريم سعد الشمري          جامعة الملك سعود             الويب       التقنية       ٢ أكت ⋮ │ │
│ │   reem@example.com        علوم حاسب · هندسة برمجيات                     (جديد)        │ │
│ │ ☐ فهد ناصر القحطاني        جامعة الإمام                 الأمن       الأمن         ٢ أكت ⋮ │ │
│ │   fahad@example.com       نظم معلومات                                  (قيد المراجعة) │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ تم تحديد 0                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Application drawer (row click, 560px)

```
┌───────────────────────────────────────────────────────────┐
│ ريم سعد الشمري                                 (جديد)    ✕ │
│ Reem Saad Alshammari · reem@example.com · +9665…          │
│ ‹ السابق   3 من 41   التالي ›                              │
│ ───────────────────────────────────────────────────────── │
│ ── الأكاديمي/المهني ──                                      │
│ الحالة    طالب          الجامعة   جامعة الملك سعود           │
│ التخصص    علوم حاسب     الدقيق    هندسة برمجيات               │
│ المسار    تطوير الويب   اللجنة المفضلة  التقنية والتطوير       │
│ ── نبذة ──                                                  │
│ مطورة واجهات مهتمة بالمصادر المفتوحة…                        │
│ ── روابط ──  GitHub ↗  LinkedIn ↗  Portfolio ↗               │
│ ── أسئلة الدورة ──                                          │
│ لماذا تريد الانضمام؟                                         │
│ «أرغب في المساهمة في مشاريع المجتمع…»                         │
│ ── الموافقة ──  وافقت على سياسة الخصوصية v1 · ٢ أكت ١٠:٠٤     │
│ ───────────────────────────────────────────────────────── │
│ ملاحظة داخلية [                                          ]  │
│ [ رفض ]   [ قائمة انتظار ]   [ قبول ]                         │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **Cycle selector** in the page header (default: current or most recent cycle); all filters and tabs apply within the cycle.
- **Status tabs** with counts ([00 §4](./00-data-model-reference.md#4-membership-application)); default tab *Submitted*.
- **Filters** — university, academic status, track, preferred committee, search; URL-synced.
- **Table** — two-line applicant cell (name + email `dir="ltr"`), university/major, track, preferred committee, submitted date, status badge, kebab. Selection for bulk decisions.
- **Drawer** — full application in reading order, prev/next navigation inside the filtered set (keyboard `j/k` optional), decision footer. Opening a `submitted` application offers *Start review* (moves to `under_review` and records the reviewer) — or reviewers can decide directly.
- **Self-application guard** — if the reviewer is the applicant, decision footer is replaced by an info note "لا يمكنك اتخاذ قرار في طلبك".
- **Bulk decisions** — same bulk bar pattern as registrations; dialog states the effect: "قبول 12 طلبًا — سيتم إنشاء سجلات العضوية وإرسال 12 رسالة ترحيب". Capacity (if set) shown as remaining.
- **Accepted applicants** — rows link to the new member record (*View member ↗*).
- **Export** — `membership.export`, CSV of the current filter, audited; personal-data warning in the confirm dialog.

## 3. States

- **Loading** — tabs + list skeleton; drawer opens with skeleton sections.
- **Empty (cycle open, none yet)** — "لم تصل أي طلبات بعد" + link to preview `/join`.
- **Decision success** — rows update; toast; email status column (sent/failed) like registrations.
- **Partial email failure** — warning toast + retry; decisions persist.
- **Quota exhausted** (bulk) — stops cleanly with `QUOTA_EXCEEDED`, shows how many emails remain queued for retry.

## 4. Data & permissions

- Read: `listApplications(cycleId, filters)`, `getApplication(id)`.
- Actions: `startReview`, `decide_membership_applications(ids, decision, note)`, `exportApplications`.
- Permissions: `membership.review` (*Q-013*), `membership.export`.
- Requirements: FR-MBR-006…009; BR-MBR-004…008.
