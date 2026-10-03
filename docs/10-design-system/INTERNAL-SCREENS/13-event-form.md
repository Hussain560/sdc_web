# Events — Creation Wizard (Create / Edit)

`/dashboard/events/new` and `/dashboard/events/[id]/edit` — a **4-step wizard**, the same as KFUCS ([ADR-012](../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md)): **الهوية Identity → التفاصيل Logistics → المحتوى Content → المراجعة Review**. Editing reopens the same wizard pre-filled, starting at step 1. Field mapping: [KFUCS alignment](../../98-reference/kfucs-event-model-alignment.md).

---

## 0. Frame (all steps)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › الفعاليات › فعالية جديدة                                   (مسودة)     │
│ فعالية جديدة                                                    [ حفظ كمسودة ]     │
│                                                                                    │
│   (✓)─────────────(2)─────────────(3)─────────────(4)                              │
│  الهوية         التفاصيل         المحتوى         المراجعة                             │
│                                                                                    │
├───────────────────────────────────────────────────────┬────────────────────────────┤
│                                                       │ معاينة البطاقة              │
│               « step content (max 720px) »            │ ┌────────────────────────┐ │
│                                                       │ │ [ صورة الغلاف 16:9 ]     │ │
│                                                       │ │ (ورشة)  (قريبًا)          │ │
│                                                       │ │ ورشة Next.js والذكاء…     │ │
│                                                       │ │ 📅 ١٠ نوفمبر · 6–8 م      │ │
│                                                       │ │ 💻 أونلاين · 60 مقعدًا     │ │
│                                                       │ └────────────────────────┘ │
│                                                       │ تُحدَّث المعاينة أثناء الكتابة │
├───────────────────────────────────────────────────────┴────────────────────────────┤
│ [ رجوع ]                                     الخطوة 2 من 4            [ التالي ]   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Progress bar:** circles with numbers; completed steps show ✓ in accent and are **clickable**. The current step has an accent ring. Future steps are muted and not clickable. The labels come from the KFUCS step list (`الهوية / التفاصيل / المحتوى / المراجعة`).
- **Preview card:** sticky in the inline-end column at ≥ 1280px. Below that it becomes a collapsible "معاينة" panel under the step content. It reuses the **public event card** component, so the preview matches the public page exactly.
- **Footer bar:** sticky. *Back* (ghost) is hidden on step 1. *Next* (primary) validates the current step first. On step 4 *Next* is replaced by the final actions.
- **Save draft** is in the header on every step (outline button). The first save creates the row and the URL switches to `/edit`.

---

## 1. Step 1 — Identity (الهوية)

```
┌───────────────────────────────────────────────────────┐
│ اللجنة المنظِّمة *     [ الذكاء الاصطناعي ▾ ]            │
│ نوع الفعالية *                                         │
│ ( ورشة ) ( معسكر ) ( هاكاثون ) ( لقاء ) ( ميت أب ) ( محاضرة ) │
│                                                       │
│ العنوان  ع *  [ ورشة Next.js والذكاء الاصطناعي       ]  │
│ Title    EN   [ Next.js & AI Workshop               ]  │
│ الرابط        events/ [ nextjs-ai-workshop ] ✓ متاح    │
│                                                       │
│ ملخص ع       [                              ] 0/500   │
│ Summary EN   [                              ] 0/500   │
│ الوصف ع   [ كتابة | معاينة ]                  0/5000   │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ## عن الورشة …                                     │ │
│ └───────────────────────────────────────────────────┘ │
│ Description EN [ Write | Preview ]                    │
└───────────────────────────────────────────────────────┘
```

| Field | Rule (Zod `step1Schema`) |
| ----- | ------------------------ |
| Committee | Required. Lists only committees where the user holds `events.create`; read-only when there is just one |
| Type | Required; chip group (KFUCS uses chips too) — **OPEN Q-040** |
| Arabic title | Required, 3–200. English optional, ≤ 200 |
| Slug | Auto-generated from the English title (or transliterated Arabic). Availability is checked on blur. It locks after the first publish (lock icon + "مقفل بعد النشر") |
| Summary / description | Optional; summary ≤ 500, description ≤ 5000 Markdown with a sanitized preview |

## 2. Step 2 — Logistics (التفاصيل)

```
┌───────────────────────────────────────────────────────┐
│ نمط الجدولة *                                          │
│ ( ● يوم واحد ) ( ○ أيام متتالية ) ( ○ تواريخ محددة )      │
│                                                       │
│ « يوم واحد »      التاريخ [ ١٠/١١/٢٠٢٦ ]                  │
│ « أيام متتالية »  من [ ……… ]  إلى [ ……… ]                 │
│ « تواريخ محددة »  [ + إضافة تاريخ ]                       │
│                   (١٠ نوفمبر ✕) (١٢ نوفمبر ✕) (١٧ نوفمبر ✕) │
│ الوقت  من [ 18:00 ]  إلى [ 20:00 ]   (بتوقيت الرياض)     │
│                                                       │
│ نوع الحضور *  ( حضوري ) ( ● أونلاين ) ( هجين )          │
│ المكان ع      [ عن بُعد — Google Meet          ]         │
│ Location EN   [ Online                         ]       │
│ رابط الخريطة   [ https://maps…  ]   « حضوري/هجين فقط »   │
│ رابط اللقاء 🔒 [ https://meet.google.com/…  ] (اختياري) │
│ ملاحظات اللقاء 🔒 [ رمز الدخول … ]                       │
│ رابط المجموعة 🔒 * [ https://chat.whatsapp.com/… ]      │
│ ⓘ الروابط المقفلة تظهر للمقبولين والمنظمين فقط وتُرسل في بريد القبول │
│                                                       │
│ عدد المقاعد   [ 60 ]  ☐ غير محدود                       │
│ يفتح التسجيل  [ عند النشر ▾ ]   يغلق [ ٩/١١/٢٠٢٦ 23:59 ]  │
│ ☑ يتطلب موافقة على التسجيل   ☐ قائمة انتظار              │
│ الجمهور  ( ● عام ) ( ○ للأعضاء فقط )                     │
└───────────────────────────────────────────────────────┘
```

| Rule (Zod `step2Schema` + `superRefine`, as in KFUCS) |
| ---------------------------------------------------- |
| Start date required; *consecutive range* requires an end date ≥ start |
| *Specific dates*: at least one date, no duplicates; the list is sorted automatically |
| Same-day events: end time > start time |
| Location text is required for in person / hybrid; the map URL must be `https://` |
| The meeting URL is optional, but must be a valid URL when present (KFUCS 2026-09-16 rule) |
| The **group link is required** and must be a valid URL (KFUCS 2026-09-16 rule) |
| Seats: a positive integer or unlimited. The waitlist switch only appears when seats are set (**OPEN Q-029**) |
| The registration deadline must be **after the start of the first day**. It may be after the event starts, so registration can be reopened (KFUCS) |

## 3. Step 3 — Content (المحتوى)

```
┌───────────────────────────────────────────────────────┐
│ صورة الغلاف  [ اسحب الصورة هنا أو اختر ] 16:9 · ≤ 2MB    │
│                                                       │
│ الأهداف *  (عربي ≥ 1، حتى 15)              [ + هدف ]    │
│  1. ع [ بناء تطبيق ويب كامل … ]  EN [ Build a full… ] ↕ ✕ │
│  2. ع [ …                    ]  EN [ …              ] ↕ ✕ │
│                                                       │
│ الأسئلة الشائعة (حتى 15)                  [ + سؤال ]    │
│  س ع [ هل الورشة مجانية؟ ]   Q EN [ Is it free? ]        │
│  ج ع [ نعم …             ]   A EN [ Yes …       ]  ↕ ✕   │
│                                                       │
│ المقدّمون (حتى 10)       [ 🔍 ابحث عن عضو… ] [ + ضيف ]    │
│  (◯ لمى — مقدِّمة ✕) (◯ ضيف: م. أحمد — محكّم ✕)          │
│                                                       │
│ ▸ تفاصيل إضافية (اختياري — كما في صفحات الفعاليات الحالية) │
│    الفئة المستهدفة · الشروط والمعايير · المهام والمسؤوليات · │
│    المخرجات · الفرص والمزايا        [ + بند ] لكل قائمة     │
│ ▸ التقدير والتواصل                                      │
│    ☐ شهادة حضور   الجوائز ع/EN [ ]                       │
│    بريد التواصل [ sdcommunity.sa@… ]  الهاتف [ ]         │
└───────────────────────────────────────────────────────┘
```

| Rule (Zod `step3Schema`) |
| ------------------------ |
| Goals: at least 1 Arabic goal (KFUCS requires 1 English goal; SDC is Arabic-first), ≤ 15, no empty items |
| FAQ: ≤ 15. The Arabic question and answer are required for each item; English is optional |
| Presenters: ≤ 10. Either a member search (profile) or a guest (name ar/en, title, photo, link); the role is presenter · mentor · judge · host |
| SDC detail lists: ≤ 20 items each, ≤ 300 characters per item; the sections are collapsed by default |
| Cover: JPEG/PNG/WebP ≤ 2 MB, with a 16:9 crop preview |

## 4. Step 4 — Review (المراجعة)

```
┌───────────────────────────────────────────────────────┐
│ ملخص الفعالية                                          │
│ ┌─ الهوية ───────────────────────────────── [ تعديل ] ┐ │
│ │ ورشة · الذكاء الاصطناعي · ورشة Next.js والذكاء…      │ │
│ ├─ التفاصيل ─────────────────────────────── [ تعديل ] ┤ │
│ │ ١٠ نوفمبر ٢٠٢٦ · 6–8 م · أونلاين · 60 مقعدًا          │ │
│ │ يغلق التسجيل ٩ نوفمبر · رابط المجموعة ✓ · رابط اللقاء ✓ │ │
│ ├─ المحتوى ──────────────────────────────── [ تعديل ] ┤ │
│ │ 4 أهداف · 3 أسئلة · مقدّمان · غلاف ✓                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                       │
│ إعدادات العرض                                           │
│ [●] إظهار المقدّمين        [●] إظهار الأهداف             │
│ [●] إظهار الأسئلة الشائعة   [ ] إظهار المقاعد المتبقية     │
│ [●] إظهار التفاصيل الإضافية [●] إغلاق التسجيل تلقائيًا عند الامتلاء │
│                                                       │
│ ملاحظة للمراجِع (اختياري) [                          ]   │
│ ☐ أؤكد أن المعلومات صحيحة ومكتملة *                       │
├───────────────────────────────────────────────────────┤
│ [ رجوع ]     [ حفظ كمسودة ]   [ إرسال للاعتماد ]          │
│              « approver: »    [ اعتماد ونشر مباشرة ]      │
└───────────────────────────────────────────────────────┘
```

- The summary has one block per step, each with an *Edit* link that jumps back to that step. Missing optional items show as muted "—".
- The display toggles are KFUCS `display_config` plus `show_details`.
- The final buttons stay disabled until the confirmation box is ticked (KFUCS).
- Which final button shows depends on permission:
  - `events.submit` → *Submit for review*.
  - `events.approve` → *Approve & publish directly* (fast-track); approvers see this **instead** of *Submit*.
  - `events.create` only (committee member) → *Save draft* only, with the hint "سيقوم رئيس اللجنة بإرسالها للاعتماد".
- **Editing a published event:**
  - The final button becomes *Save changes*.
  - If dates, mode or location changed, a `ConfirmDialog` lists the changes and says accepted registrants will be emailed (`event.changed`).

## 5. States

| State | Behaviour |
| ----- | --------- |
| Loading (edit) | Progress-bar skeleton + `Skeleton.Form` (6 fields) + preview-card skeleton ([form skeleton](./04-skeleton-loading.md)) |
| Restored draft | The wizard resumes from `localStorage` (key `sdc-event-wizard:<userId>:<eventId \| new>`). An info alert says "استعدنا آخر تعديل غير محفوظ" with [ تجاهل ]. The key is cleared after a successful save |
| Validation | *Next* runs the step schema. Errors show inline in the active language, an error summary `Alert` appears above the step, and the first invalid field is focused. The progress bar marks the step with a warning dot |
| Unsaved changes | Dirty dot next to *Save draft*; a navigation guard dialog |
| Read-only | For a `pending_review` event the submitter sees a banner "بانتظار الاعتماد — اسحب الطلب للتعديل" + [ سحب الطلب ], and every step is read-only |
| Changes requested | Warning banner at the top of every step with the reviewer's note |
| Server error | Toast; the state is kept (and remains in `localStorage`) |
| Mobile (< 768px) | The progress bar collapses to "الخطوة 2 من 4 — التفاصيل" with a thin progress line; the preview is a bottom sheet opened from a "معاينة" button |

## 6. Data & permissions

- Server actions: `createEventDraft`, `updateEvent`, `submitEvent`, `approveEvent` (fast-track), `uploadEventCover`, `setEventPresenters`, `setEventDates`.
- Validation: `step1Schema`, `step2Schema`, `step3Schema`, `step4Schema` and the merged `fullEventSchema`, shared by the client and the server (copied from the KFUCS shape, Arabic-first).
- Permissions: `events.create`/`events.edit` in the selected committee's scope; `events.submit`; `events.approve`.
- Requirements: FR-EVT-001, FR-EVT-002, FR-EVT-007, FR-EVT-009.
- KFUCS reference implementation: `kfucs-portal/src/components/admin-events/wizard/*`, `src/hooks/useEventWizard.ts`. Rebuild it on SDC tokens and permission checks; don't copy it verbatim.
