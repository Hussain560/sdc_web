# Join Page — Membership Intake (`/join`)

The **dedicated membership page** (DECISION D-001): open only during an intake cycle (about once a year). This is a **new public page**: it reuses the existing public visual language (public `Header`/`Footer`, page banner with breadcrumb, auth-card styling) and does not change any existing public page. Account creation stays on `/register`.

---

## 1. Blueprints by cycle state

### 1.1 Closed (no open or scheduled cycle)

```
┌──────────────────────────── public Header ─────────────────────────────┐
│  [banner]  الرئيسية › انضم إلينا                                          │
│            انضم إلى المجتمع السعودي للمطورين                               │
├────────────────────────────────────────────────────────────────────────┤
│        ┌──────────────────────────────────────────────────────┐        │
│        │                     🔒                                │        │
│        │        استقبال طلبات العضوية مغلق حاليًا               │        │
│        │  نفتح باب العضوية مرة في السنة تقريبًا. تابع حساباتنا    │        │
│        │  ليصلك إعلان الدورة القادمة.                            │        │
│        │        [ 𝕏 ]  [ in ]  [ ◎ ]                            │        │
│        │  يمكنك حضور فعالياتنا دون عضوية → [ تصفح الفعاليات ]     │        │
│        └──────────────────────────────────────────────────────┘        │
└──────────────────────────── public Footer ─────────────────────────────┘
```

### 1.2 Scheduled

Same card: "يفتح استقبال الطلبات في ١ أكتوبر ٢٠٢٦" + countdown (days) + "أنشئ حسابك الآن لتكون جاهزًا" → `/register`.

### 1.3 Open — signed out

```
        ┌──────────────────────────────────────────────────────┐
        │ ✦ استقبال طلبات العضوية 2026 مفتوح حتى ٣٠ أكتوبر         │
        │ (cycle description / eligibility rendered from Markdown) │
        │ خطوات التقديم: ① سجّل الدخول ② املأ النموذج ③ انتظر القرار │
        │      [ تسجيل الدخول للتقديم ]   [ إنشاء حساب ]             │
        └──────────────────────────────────────────────────────┘
```

### 1.4 Open — signed in (application stepper)

```
        ┌──────────────────────────────────────────────────────────────┐
        │ ① البيانات الشخصية ── ② الدراسة والعمل ── ③ نبذة وروابط ── ④ أسئلة ── ⑤ المراجعة │
        │ ──────────────────────────────────────────────────────────── │
        │ ② الدراسة والعمل                                               │
        │ الحالة *        ( ● طالب ) ( ○ خريج ) ( ○ موظف ) ( ○ أخرى )        │
        │ الجامعة *       [ جامعة الملك سعود ▾ ]  (أخرى؟ اكتبها)              │
        │ التخصص *        [ علوم حاسب ▾ ]   التخصص الدقيق [ ▾ ]               │
        │ المسار *        [ تطوير الويب ▾ ]                                  │
        │ اللجنة المفضلة   [ اختياري ▾ ]                                     │
        │ ──────────────────────────────────────────────────────────── │
        │ [ السابق ]                                          [ التالي ]  │
        └──────────────────────────────────────────────────────────────┘

        ⑤ المراجعة: summary of all steps with "تعديل" links
        ☐ قرأت سياسة الخصوصية وأوافق على معالجة بياناتي لغرض طلب العضوية *
        ☐ أرغب في الظهور في دليل الأعضاء العام عند قبولي
                                              [ إرسال الطلب ]
```

### 1.5 Already applied / closed awaiting decisions / member

- Applied: status panel (timeline submitted → under review → decision) + *Edit*/*Withdraw* while allowed + link to `/account/membership`.
- Closed awaiting decisions: "أُغلق استقبال الطلبات في ٣٠ أكتوبر — ستصلك النتيجة بالبريد".
- Already a member: "أنت عضو في المجتمع ✓" + link to profile.

---

## 2. Layout rules

- Public chrome: existing `Header`/`Footer`, the standard page banner (164px) with breadcrumb, card styled like the auth card (accent top border, radius 20px) but wider (max 720px).
- Stepper: 5 steps, progress persisted in `sessionStorage` (draft only — Proposed) so a refresh doesn't lose answers; each step validates before *Next*; Arabic/English names side by side; links `https://` validated; cycle questions rendered from the cycle's `questions` definition.
- Consent checkbox required with link to the privacy notice (opens in new tab); directory visibility opt-in separate and optional.
- The submit is a Server Action that re-checks the cycle is open at insert time; closing mid-fill shows the closed message and keeps the draft locally.
- Fully bilingual; server-rendered `lang`/`dir`.

## 3. States

- **Loading** — banner + card skeleton (title, 3 lines, 2 buttons); stepper skeleton (step pills + `Skeleton.Form` 5 fields).
- **Submit success** — confirmation panel "تم استلام طلبك ✓" + what happens next + email sent notice.
- **Errors** — `CYCLE_CLOSED`, `ALREADY_APPLIED`, `ALREADY_MEMBER`, `VALIDATION_FAILED` mapped to friendly messages.

## 4. Data & permissions

- Read: `getCurrentCyclePhase()` (public view), `getMyApplication(cycleId)` (own).
- Actions: `submit_membership_application`, `updateApplication`, `withdrawApplication`.
- No permission keys — ownership + cycle-open guard (BR-MBR-002/004/005/006).
- Requirements: FR-MBR-003, FR-MBR-004, FR-MBR-005, FR-AUTH-002.
