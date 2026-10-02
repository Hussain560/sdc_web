# Account Area — My Registrations, My Membership, My Profile

`/account/*` — personal pages for every signed-in user, inside the internal shell (sidebar group *حسابي / My account*). Ownership rules only; no permission keys.

---

## 1. Blueprints

### 1.1 My registrations — `/account/registrations`

```
┌──────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › تسجيلاتي                                                  │
│ تسجيلاتي في الفعاليات                                                   │
│ [ القادمة (2) ] [ السابقة (5) ] [ الملغاة (1) ]                          │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ ▣ لقاء تقني: بيئات العمل وأساسيات GitHub                           │ │
│ │   ٢٥ أكتوبر ٢٠٢٦ · ٧:٠٠ م · أونلاين           (✓ مقبول)            │ │
│ │   🔗 رابط اللقاء: meet.google.com/…  [ نسخ ]                        │ │
│ │                                       [ تفاصيل الفعالية ] [ إلغاء التسجيل ] │
│ ├──────────────────────────────────────────────────────────────────┤ │
│ │ ▣ ورشة Next.js والذكاء الاصطناعي                                    │ │
│ │   ١٠ نوفمبر ٢٠٢٦ · جدة                        (⏳ قيد المراجعة)      │ │
│ │                                       [ تفاصيل الفعالية ] [ إلغاء التسجيل ] │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 My membership — `/account/membership`

```
Non-member, cycle open                     Applicant                                 Member
┌─────────────────────────────┐   ┌───────────────────────────────────┐   ┌──────────────────────────────────┐
│ لست عضوًا بعد                  │   │ طلب العضوية — دورة 2026             │   │ عضو نشط ✓  منذ أكتوبر 2025         │
│ استقبال الطلبات مفتوح حتى ٣٠ أكتوبر│  │ ● قُدِّم ─── ◉ قيد المراجعة ─── ○ القرار │   │ انضم عبر: دورة 2025                 │
│ [ قدّم طلب العضوية ]           │   │ قُدِّم في ٣ أكتوبر                   │   │ اللجان: الذكاء الاصطناعي (عضو)       │
└─────────────────────────────┘   │ [ عرض الطلب ] [ تعديل ] [ سحب الطلب ] │   │ الظهور في الدليل: ● ظاهر            │
                                   └───────────────────────────────────┘   │ [ تعديل ملفي ]                      │
                                                                           └──────────────────────────────────┘
```

### 1.3 My profile — `/account/profile`

```
┌───────────────────────────────────────────────────────────────────────┐
│ ملفي الشخصي                                                              │
│ ┌─ الحساب ──────────────────────────────────────────────────────────┐ │
│ │ الاسم (عربي) *     [ سارة عبدالله العتيبي            ]               │ │
│ │ الاسم (إنجليزي)    [ Sara Abdullah Alotaibi           ]  dir=ltr     │ │
│ │ البريد الإلكتروني   sara@example.com   [ تغيير البريد ]               │ │
│ │ لغة الرسائل        (● العربية) (○ English)                          │ │
│ │ كلمة المرور         ••••••••           [ تغيير كلمة المرور ]          │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌─ ملف العضوية (للأعضاء فقط) ─────────────────────────────────────────┐ │
│ │ الحالة الأكاديمية [ طالب ▾ ]  الجامعة [ جامعة الملك سعود ▾ ]          │ │
│ │ التخصص [ علوم حاسب ▾ ]  الدقيق [ هندسة برمجيات ▾ ]  المسار [ الويب ▾ ] │ │
│ │ نبذة (عربي) [                                         ] 0/1000      │ │
│ │ نبذة (إنجليزي) [                                      ]              │ │
│ │ روابط  GitHub [https://…]  LinkedIn [https://…]  X [ ]  Portfolio [ ] │ │
│ │ الظهور في دليل الأعضاء   [■ ظاهر]                                    │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                         [ إلغاء ]   [ حفظ التغييرات ]                   │
│ ┌─ منطقة الخطر ─────────────────────────────────────────────────────┐ │
│ │ طلب حذف الحساب                                   [ طلب الحذف ]       │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **Registrations** — tabs (Upcoming / Past / Cancelled) in the URL; registration cards (not a table) — event cover thumbnail 64px, title, date/time, format, status badge ([00 §2](./00-data-model-reference.md#2-event-registration)). Meeting link block shows only when `accepted` and online (with copy button). *Cancel registration* shows until the event starts (`ConfirmDialog`). Past tab shows attendance (attended / absent / not recorded).
- **Membership** — one state panel per situation; the application progress uses the same horizontal timeline component as event detail. *Edit/Withdraw* visible only while `submitted` and the cycle is open (BR-MBR-006). Rejected applicants see a kind message and, if a future cycle is scheduled, its date (*Q-012*).
- **Profile** — two sections: *Account* (everyone) and *Member profile* (active members only). Taxonomy fields are managed lists with "Other…" entry. Links validated `https://` inline. Directory visibility switch with a preview link "معاينة ملفي العام". Email/password changes go through Auth flows (confirmation emails).
- Sticky save bar appears only when the form is dirty; leaving with unsaved changes asks for confirmation.

## 3. States

- **Loading** — registrations: 3 card skeletons; membership: state panel skeleton (title line + timeline); profile: `Skeleton.Form` (12 fields).
- **Empty** — no registrations: "لم تسجل في أي فعالية بعد" + *Browse events*.
- **Saved** — toast "تم حفظ التغييرات"; invalid fields scroll into view with focus.
- **Legacy member not yet claimed** — profile section shows "تم ربط ملف عضويتك السابق" after a successful claim.

## 4. Data & permissions

- Ownership: RLS `user_id = auth.uid()` on registrations, applications, members (own row), profiles.
- Actions: `cancelRegistration`, `withdrawApplication`, `updateApplication`, `updateMyProfile`, `updateMyMemberProfile`, `requestAccountDeletion`.
- Requirements: FR-AUTH-008/009, FR-REG-002, FR-MBR-005, FR-MEM-003.
