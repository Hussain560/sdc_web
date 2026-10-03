# Administration — Audit Log, Email Log, Reference Data, Site Settings

Four operational screens for system administrators (and the community leader for email log, reference data and settings).

---

## 1. Audit log — `/dashboard/admin/audit`

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ … › سجل التدقيق                                                                    │
│ [ الفاعل 🔍 ] [ الإجراء ▾ ] [ نوع الكيان ▾ ] [ من–إلى 📅 ]                           │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ الوقت            الفاعل          الإجراء                الكيان                  │ │
│ │──────────────────────────────────────────────────────────────────────────────│ │
│ │ ٢ أكت ١٤:٠٢      فيصل العمري     event.approved        فعالية: ورشة Next.js ↗   │ │
│ │ ٢ أكت ١٣:٥٥      هيا المالكي     registration.accepted ×12  ورشة Next.js ↗       │ │
│ │ ٢ أكت ١٠:١٠      نوف الحربي      role.assigned         هيا ← قائدة · الذكاء     │ │
│ │   ▸ التفاصيل: { "role": "committee_head", "committee": "ai", "starts_at": … }   │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│ ‹ الأحدث       صفحة 1        الأقدم ›                                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Rules: append-only (no edit/delete affordances anywhere); rows expandable to show the `summary` JSON rendered as a key/value list (never raw secrets); entity links open the record if it still exists; cursor pagination (newest first); export only for `system_admin` (audited). Permission: `audit.view`.

## 2. Email log — `/dashboard/admin/emails`

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ … › سجل البريد                     اليوم: 83 مُرسلة / 300 الحد اليومي ▓▓▓░░░░░    │
│ [ الحالة: فشل ▾ ] [ القالب ▾ ] [ المستلم 🔍 ] [ التاريخ 📅 ]   [ إعادة محاولة الفاشلة ] │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ الوقت      المستلم              القالب                    الحالة    المحاولة  ⋮ │ │
│ │ ٢ أكت ١٤:٠٣ khaled@example.com  registration.confirmed    (فشل)     2        ⋮ │ │
│ │            ↳ RATE_LIMITED — سيُعاد تلقائيًا ١٥:٠٠                                │ │
│ │ ٢ أكت ١٤:٠٣ noura@example.com   registration.confirmed    (أُرسل)    1        ⋮ │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Rules: daily quota meter (warning ≥ 80%); failed rows show error code + next automatic retry; *Retry* per row and *Retry all failed* (confirm with count, respects quota); recipient emails `dir="ltr"`; links to the related registration/application. Permission: `email_logs.view` (organizers see the same data inside their registration/application tables only).

## 3. Reference data — `/dashboard/admin/reference-data`

```
[ الجامعات ] [ التخصصات ] [ المسارات ] [ الوسوم ]
┌──────────────────────────────────────────────────────────────────┐
│ الاسم (عربي)          الاسم (إنجليزي)              مستخدم   نشط   ⋮ │
│ جامعة الملك سعود      King Saud University          84       ●     ⋮ │
│ [ + إضافة ]                                    [ دمج مكرر… ]        │
└──────────────────────────────────────────────────────────────────┘
```

Rules: inline add/edit row; deactivate instead of delete when used (usage count shown); *Merge duplicates* moves references to one value (confirm, audited); majors tab shows sub-majors nested under majors. "Other" answers from applications appear in a *Needs mapping* list for reviewers. Permission: `reference_data.manage`.

## 4. Site settings — `/dashboard/admin/settings`

```
── التواصل الاجتماعي ──
X        [ https://x.com/SDC_Saudi              ]
LinkedIn [ https://www.linkedin.com/company/…   ]
Instagram[ https://instagram.com/…               ]  ⚠ الرابط الحالي يشير للصفحة الرئيسية لإنستغرام
── التواصل ──
البريد العام [ sdcommunity.sa@gmail.com ]
── التذييل ──
نص الحقوق (ع/EN) [ … ]   ☑ السنة تلقائيًا
                                   [ حفظ الإعدادات ]
```

Rules: values validated (`https://`), changes audited, public pages revalidated on save; only keys marked public are exposed to the website. Permission: `settings.manage` (FR-ADM-005, Could).

## 5. States (all four)

- **Loading** — table/list skeletons (settings: `Skeleton.Form`).
- **Empty** — audit: "لا توجد سجلات للفترة"; email failures: success empty state "لا توجد رسائل فاشلة ✓".
- **Errors** — inline alerts with retry.
