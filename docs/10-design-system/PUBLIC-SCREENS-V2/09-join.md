# 09 — Join `/join`

**Purpose.** Explain how membership works and when the next window is. When the intake is open, take an application without an account (ADR-013).

## 1. Page structure (all phases)

```text
 الرئيسية › انضم إلينا
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ انضم إلى المجتمع                                  t-h1                                    │
 │ العضوية مجانية وتفتح في دورات محددة خلال العام.     t-lede  ‹owner copy›                   │
 │ ┌ cycle panel (changes by phase, see §2) ──────────────────────────────────────────────┐ │
 │ └──────────────────────────────────────────────────────────────────────────────────────┘ │
 └────────────────────────────────────────────────────────────────────────────────────────┘
 ●● كيف تصبح عضواً                                     membership journey (stepper, read-only)
  ① قدّم الطلب  →  ② نراجع طلبك  →  ③ نرسل النتيجة  →  ④ تفعّل حسابك  →  ⑤ تبدأ مع لجنتك
 ●● ماذا تحصل عليه       4 feature cards (same benefits as home ⑤, owner copy)
 ●● الأسئلة الشائعة       accordion (membership questions)
```

## 2. The cycle panel by phase (`membership_cycle_phase`)

| Phase | Panel | Action |
| ----- | ----- | ------ |
| None / completed | `Info` · "باب العضوية مغلق الآن / Applications are closed right now" · "نعلن الدورة القادمة على حساباتنا. / We announce the next intake on our accounts." | Social links (X, LinkedIn) |
| Scheduled | `CalendarClock` · "يفتح باب العضوية في ‹opens_at› / Applications open on ‹opens_at›" · a countdown chip when < 7 days | "أضف التذكير إلى التقويم / Add a reminder to my calendar" (.ics, no data collected) |
| Open | `CircleCheck` success · "باب العضوية مفتوح حتى ‹effective_closes_at› / Applications are open until ‹date›" + the cycle description | **"ابدأ الطلب / Start your application"** → the form (§3) on the same page |
| Closed, awaiting decisions | `Clock` · "أُغلق باب التقديم، ونراجع الطلبات الآن. / Applications have closed and we're reviewing them." | — |
| Signed-in active member | `Check` · "أنت عضو في المجتمع / You're a member" | "اذهب إلى حسابي / Go to my account" |
| Already applied (this browser / e-mail confirmed) | ApplicationStatusPanel: a stepper (submitted → review → decision) with the current status | Withdraw while allowed (ghost, with a confirm) |

## 3. The application (open phase)

A [stepper](../components.md#74-stepper) form in `--container-narrow`: **البيانات الشخصية / Personal details → الدراسة والعمل / Study & work → نبذة وروابط / Bio & links → أسئلة / Questions (only when the cycle has questions) → المراجعة / Review**.

- Each step validates on "التالي / Next"; "السابق / Back" keeps the values; the draft is saved locally per cycle (as today) with a note "نحفظ مسودتك على هذا الجهاز / Your draft is saved on this device".
- The review step shows every answer with "تعديل / Edit" per group, the directory-listing choice ("أظهر اسمي في دليل الأعضاء / List me in the member directory", off by default), and the consent line linking `/privacy`.
- Submit uses the [minimum-duration feedback](../patterns.md#132-minimum-duration-submit-registration) (1.5 s floor, form locked) and ends in a result block in place of the form:

| Result | Title (AR / EN) | Sentence |
| ------ | --------------- | -------- |
| Submitted | استلمنا طلبك / We received your application | سنراسلك على ‹email› بالنتيجة. / We'll e-mail ‹email› with the outcome. |
| Already applied | لديك طلب في هذه الدورة / You've already applied in this intake | تفقّد بريدك لمتابعة حالته. / Check your inbox to follow its status. |
| Too many attempts | محاولات كثيرة / Too many attempts | انتظر قليلاً ثم حاول مرة أخرى. |
| Closed meanwhile | أُغلق باب التقديم / Applications have closed | انتهت الدورة قبل وصول طلبك. |
| Error | تعذّر إرسال الطلب / We couldn't send your application | حدث خطأ غير متوقع… + "حاول مرة أخرى" (the form keeps the values) |

## 4. Data

`membership_cycle_phase` (phase, dates, description, questions), `universities`, `majors`, `tracks`, `my_membership_application` (signed in), the application RPC with its anti-spam (`application_attempts`).

## 5. Media

None required. Optional `M-50` (shared with About).
