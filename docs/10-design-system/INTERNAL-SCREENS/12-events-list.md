# Events — Management List

`/dashboard/events` — all events the user can see in scope: drafts, review queue, published, past. Replaces hardcoded event arrays and is the entry point for the event lifecycle.

---

## 1. Blueprint

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  لوحة التحكم › الفعاليات                                                           │
│                                                                                    │
│  الفعاليات                                                    [ + فعالية جديدة ]  │
│  إدارة فعاليات اللجان ومتابعة مراحلها                                                │
│                                                                                    │
│  [ الكل 14 ] [ مسودات 3 ] [ بانتظار الاعتماد 2 ] [ مطلوب تعديلات 1 ] [ منشورة 5 ]  │
│  [ مكتملة 2 ] [ ملغاة 1 ]                                                          │
│                                                                                    │
│  [ 🔍 ابحث بالعنوان…        ] [ اللجنة: الكل ▾ ] [ النوع ▾ ] [ الفترة: القادمة ▾ ]   │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │ الفعالية                       اللجنة      الموعد         الحالة       التسجيل  ⋮ │ │
│  │──────────────────────────────────────────────────────────────────────────────│ │
│  │ ▣ ورشة Next.js والذكاء          الذكاء      ١٠ نوف ٢٠٢٦   (منشورة)     48/60  ⋮ │ │
│  │   Next.js & AI Workshop                    جدة            (التسجيل متاح) ▓▓▓▓░  │ │
│  │──────────────────────────────────────────────────────────────────────────────│ │
│  │ ▣ لقاء GitHub                  التقنية     يُعلن لاحقًا    (بانتظار الاعتماد) —  ⋮ │ │
│  │   GitHub Basics Meetup                     أونلاين         منذ يومين           │ │
│  │──────────────────────────────────────────────────────────────────────────────│ │
│  │ ▣ معسكر CTF                    الأمن       ٢٧ أكت–١ نوف   (مطلوب تعديلات)  —  ⋮ │ │
│  │   ↳ «يرجى تحديد المتطلبات المسبقة» — فيصل، منذ ٣ ساعات                         │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                   ‹  1  2  ›        24 لكل صفحة ▾                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **PageHeader** — title, description, primary *+ New event* (`events.create` in any scope).
- **Status tabs** — counts per editorial status; clicking sets `?status=`. Approvers see *Pending approval* first and highlighted in warning tone when > 0. Committee-only users see only their committees' counts.
- **Filters** — search (title ar/en), committee (only committees in scope; hidden when user has one), type, period (upcoming / past / all), format. All in URL; reset link when any active.
- **Table** (`Table` primitive; stacked cards on mobile):
  | Column | Content |
  | ------ | ------- |
  | Event | cover thumbnail 40px + two-line title (active-locale title first, other language muted, `dir` per language) |
  | Committee | committee name chip |
  | Date | localized date (+ venue/online on second line); "يُعلن لاحقًا / TBA" when null |
  | Status | editorial status badge; published rows also show the phase chip |
  | Registration | accepted/capacity + thin progress bar; "—" if not published |
  | Kebab | row actions per [allowed actions](./00-data-model-reference.md#14-allowed-actions-by-status) ∩ permissions |
- **Review note line** — rows in `changes_requested` show the reviewer's note under the title (one line, ellipsis, full text in tooltip).
- Row click opens [14-event-detail-review](./14-event-detail-review.md).
- Default sort: pending first for approvers, then by `starts_at` (upcoming ascending, past descending).

## 3. States

- **Loading** — list skeleton §2.1 (tabs as pills, 8 rows).
- **Empty (no events in scope)** — "لا توجد فعاليات بعد" + *New event* if permitted.
- **Empty after filters** — reset filters.
- **Row action success** — toast + row updates in place (no full reload).
- **Founder (view only)** — no primary button, no kebab actions; "عرض فقط" badge.

## 4. Data & permissions

- Query: `listEvents({ status, committeeId, type, period, q, page, size })` through RLS — out-of-scope drafts never return.
- Counts: grouped count view in the same scope.
- Permissions: `events.view_drafts` (screen), `events.create` (button), row actions per §00.
- Requirements: FR-EVT-001…005.
