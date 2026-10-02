# Membership — Intake Cycles

`/dashboard/membership/cycles` — leadership schedules the community's periodic membership intake (about once a year — DECISION D-001): when `/join` opens and closes, what it says, and which extra questions it asks.

---

## 1. Blueprint

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › العضوية › دورات الاستقبال                                              │
│ دورات استقبال العضوية                                         [ + دورة جديدة ]     │
│ صفحة الانضمام تقبل الطلبات فقط أثناء دورة مفتوحة                                     │
│                                                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✦ الدورة الحالية: استقبال طلبات العضوية 2026                    (مفتوحة)       │ │
│ │   ١ أكتوبر ← ٣٠ أكتوبر ٢٠٢٦ · يتبقى ٢٨ يومًا                                   │ │
│ │   ▓▓░░░░░░░░░░░░░░░░░░  اليوم ٢ من ٣٠                                           │ │
│ │   طلبات: 41 جديدة · 6 قيد المراجعة · 0 مقبولة                                    │ │
│ │                [ عرض الطلبات ]  [ تمديد ]  [ إغلاق مبكر ]   [ معاينة /join ↗ ]  │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ الدورة                     الفترة                       المرحلة     الطلبات  ⋮ │ │
│ │──────────────────────────────────────────────────────────────────────────────│ │
│ │ استقبال الطلبات 2026        ١ أكت – ٣٠ أكت ٢٠٢٦           (مفتوحة)      47     ⋮ │ │
│ │ استقبال الطلبات 2025        ١ سبت – ٢٠ سبت ٢٠٢٥           (مكتملة)     112     ⋮ │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Create / edit cycle drawer (480px, inline-end)

```
┌─────────────────────────────────────────────────────┐
│ دورة استقبال جديدة                                 ✕ │
│ ── الاسم والوصف ──                                   │
│ الاسم (عربي) *   [ استقبال طلبات العضوية 2026     ]   │
│ الاسم (إنجليزي)  [ Membership Intake 2026         ]   │
│ الوصف/الشروط (عربي) [ كتابة | معاينة ]                 │
│ [                                               ]   │
│ ── الفترة ──                                          │
│ يفتح *  [ ١/١٠/٢٠٢٦ ٠٠:٠٠ ]   يغلق * [ ٣٠/١٠/٢٠٢٦ ٢٣:٥٩ ] │
│ ⚠ تتداخل مع «دورة 2026 التجريبية» (١٥–٢٠ أكتوبر)        │
│ هدف القرار [ ١٥/١١/٢٠٢٦ ]   الحد الأقصى للقبول [    ]   │
│ ── أسئلة إضافية (اختياري) ──                          │
│ 1. لماذا تريد الانضمام؟   نص طويل · مطلوب        ⋮ ↕   │
│ 2. اللجنة المفضلة         اختيار واحد                 │
│ [ + سؤال ]                                            │
│ ──────────────────────────────────────────────────── │
│ [ إلغاء ]   [ حفظ كمسودة ]   [ نشر الجدول ]             │
└─────────────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **Current-cycle hero card** — shows the most relevant cycle: open → scheduled → closed (awaiting decisions). Progress bar of the window, live counts by application status, contextual actions: *View applications*, *Extend* (date picker dialog), *Close early* (confirm), *Preview /join*, *Complete cycle* (enabled only when no undecided applications; otherwise disabled with "يوجد 12 طلبًا دون قرار").
- **Cycle table** — name, window (localized range), derived phase chip ([00 §3](./00-data-model-reference.md#3-membership-cycle)), application count, kebab (edit, publish/unpublish, open now, extend, close early, complete, delete draft).
- **Drawer form** — sections: name & description (Markdown preview identical to `/join`), window (with **inline overlap conflict** from the exclusion rule — BR-MBR-003), decision target date, capacity (*Q-011*), question builder (types: short text, long text, single choice, multiple choice; required toggle; ar/en labels; reorder; max 10). Questions lock once the first application arrives (lock icon + hint).
- **Footer actions** — *Save draft*, *Publish schedule* (status → published; phase derived from dates), or *Open now* (sets `opens_at = now`).
- Phase is always derived from dates — the UI never offers "mark as open" without a date change.

## 3. States

- **Loading** — hero card skeleton (title, progress bar, 3 count lines, 4 buttons) + table skeleton (3 rows).
- **No cycles** — EmptyState "لم تُنشأ أي دورة بعد" + *New cycle*; `/join` currently shows "closed".
- **Overlap on save** — server `CYCLE_OVERLAP` → field error on dates.
- **Extend while closed** — allowed before completion; confirmation explains `/join` reopens immediately.

## 4. Data & permissions

- Actions: `createCycle`, `updateCycle`, `publishCycle`, `openCycleNow`, `extendCycle`, `closeCycleEarly`, `completeCycle`, `deleteDraftCycle`.
- Permission: `membership.manage_cycles` (global). Founders do not see this screen.
- Requirements: FR-MBR-001, FR-MBR-002; rules MC-1…5, BR-MBR-002/003.
