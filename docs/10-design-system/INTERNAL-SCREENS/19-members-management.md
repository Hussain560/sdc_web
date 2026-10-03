# Members — Management List & Member Detail

`/dashboard/members` and `/dashboard/members/[id]` — leadership's view of all member records (including hidden and legacy ones), status changes, and legacy profile claims. Founders see the same screens read-only (*Q-007*, *Q-032*).

---

## 1. Blueprints

### 1.1 List

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › الأعضاء                                                                │
│ الأعضاء                                                       [ ⤓ تصدير ] (عرض فقط)  │
│ [ نشط 312 ] [ موقوف 2 ] [ غير نشط 14 ] [ لم يُطالب به 9 ]                            │
│ [ 🔍 الاسم أو البريد ] [ الجامعة ▾ ] [ التخصص ▾ ] [ المسار ▾ ] [ اللجنة ▾ ] [ الدورة ▾ ] │
│ ┌────────────────────────────────────────────────────────────────────────────────┐ │
│ │ العضو                        الجامعة / التخصص          اللجان          انضم   الحالة ⋮ │ │
│ │────────────────────────────────────────────────────────────────────────────────│ │
│ │ (س) سارة العتيبي  👁           جامعة الأميرة نورة         الذكاء (عضو)    2025  (نشط) ⋮ │ │
│ │     sara@example.com          ذكاء اصطناعي                                         │ │
│ │ (ع) عبدالله الغامدي  ⊘          جامعة الملك عبدالعزيز       —              قديم  (نشط) ⋮ │ │
│ │     — لم يُربط بحساب            أمن سيبراني                             (لم يُطالب به) │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
👁 = visible in public directory · ⊘ = hidden
```

### 1.2 Member detail

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ … › الأعضاء › سارة العتيبي                                                          │
│ (س) سارة العتيبي   (نشط)                              [ إيقاف ] [ إنهاء العضوية ] ⋮   │
│     Sara Alotaibi · عضو منذ سبتمبر 2025 · دورة 2025                                  │
├─────────────────────────────┬──────────────────────────────────────────────────────┤
│ ── الحساب ──                 │ [ الملف ] [ اللجان والمناصب ] [ المشاركة ] [ السجل ]     │
│ البريد  sara@example.com     │                                                      │
│ الجوال  —                    │  الملف (كما يظهر في الدليل)                              │
│ ── العضوية ──                │  ┌───────────── member card preview ─────────────┐ │
│ انضمت عبر  طلب (2025)        │  │ (س) سارة العتيبي · ذكاء اصطناعي · جامعة نورة      │ │
│ الظهور في الدليل  ● ظاهر     │  └───────────────────────────────────────────────┘ │
│ الطلب الأصلي ↗               │  الحالة الأكاديمية طالبة · المسار الذكاء الاصطناعي        │
│                             │  نبذة …  · روابط GitHub ↗ LinkedIn ↗                   │
│                             │                                                      │
│                             │  المشاركة: 6 تسجيلات · 5 حضور · آخر فعالية: ورشة Next.js │
└─────────────────────────────┴──────────────────────────────────────────────────────┘
```

### 1.3 Status dialog (suspend / end membership)

```
        ┌──────────────────────────────────────────────┐
        │ إيقاف عضوية سارة العتيبي                   ✕ │
        │ ستُخفى من الدليل وتنتهي مناصبها في اللجان (1).  │
        │ السبب * [                                  ]  │
        │ ⓘ يُحفظ في السجل ولا يظهر للعموم               │
        │        [ تراجع ]      [ إيقاف العضوية ]         │
        └──────────────────────────────────────────────┘
```

### 1.4 Legacy claim (unclaimed records)

```
 ── ربط الحساب ──
 هذا السجل منقول من الموقع السابق ولم يُربط بحساب.
 البريد لإرسال رابط الربط [ abdullah@example.com ]   [ إرسال رابط الربط ]
 آخر إرسال: — 
```

---

## 2. Layout rules

- **Tabs** — active / suspended / inactive / unclaimed legacy (flag), with counts.
- **Filters** — university, major, track, committee, joining cycle, directory visibility, search; URL-synced.
- **Table** — avatar initial (green gradient as public cards), name + email (private column — only with `members.view`), visibility icon (👁/⊘ with label tooltip), university/major, committees with roles, joined (year or "legacy"), status badge, kebab (view, suspend, reinstate, end membership, send claim link).
- **Detail** — header actions by status ∩ `members.manage`; rail with account and membership facts; tabs: *Profile* (with a **public card preview** using the existing member card style), *Committees & positions* (read; links to committee screen for changes), *Participation* (registrations/attendance summary), *History* (audit).
- **Status dialogs** require a reason and state consequences (directory hidden, committee roles ended — BR-MBR-011).
- **View-only mode** (founders): no action buttons or kebabs; private columns follow *Q-007* (default: hidden for founders).
- Profile fields are not edited here by default (members own their profile — *Q-030*).

## 3. States

- **Loading** — list skeleton (avatar circle column) / detail skeleton §2.2.
- **Empty filters** — reset.
- **Claim link sent** — toast + "آخر إرسال" updates; failures show in email log.
- **Suspended** — danger banner on detail with reason/date and *Reinstate*.

## 4. Data & permissions

- Read: `listMembers(filters)`, `getMember(id)` (private fields only with `members.view`).
- Actions: `changeMemberStatus(id, status, reason)`, `sendLegacyClaim(id, email)`, `exportMembers(filters)` (audited).
- Permissions: `members.view`, `members.manage`.
- Requirements: FR-MEM-004, FR-MEM-005.
