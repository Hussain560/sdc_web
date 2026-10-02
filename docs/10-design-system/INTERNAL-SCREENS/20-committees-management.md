# Committees — List, Committee Detail, Positions & Terms

`/dashboard/committees` and `/dashboard/committees/[id]` — the committees and who holds which position for which term. This screen replaces the hardcoded leadership on the public members page: the public leadership view is generated from these assignments.

---

## 1. Blueprints

### 1.1 Committees list (leader / admin)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › اللجان                                                           │
│ اللجان                                                        [ + لجنة جديدة ]│
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐               │
│ │ ◆ الذكاء الاصطناعي  │ │ ◆ الأمن السيبراني   │ │ ◆ التقنية والتطوير  │               │
│ │ القائدة: هيا المالكي │ │ القائدة: دانة    │ │ القائدة: لمى       │               │
│ │ 18 عضوًا · 4 فعاليات│ │ 12 عضوًا · 2 فعالية │ │ 21 عضوًا · 3 فعاليات│               │
│ │ (نشطة)            │ │ (نشطة)            │ │ نائبة: رغد       │               │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘               │
│ ┌──────────────────┐ ┌──────────────────┐                                    │
│ │ ◆ المشاريع         │ │ ◆ التصميم والهوية   │                                    │
│ └──────────────────┘ └──────────────────┘                                    │
│                                                                                │
│ ── قيادة المجتمع ──                                       [ تعيين منصب ]       │
│ المؤسِّستان: (أ) · (ب)   قائد المجتمع: فيصل (منذ 2025)   المستشارة: (ج)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Committee detail

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ … › اللجان › لجنة الذكاء الاصطناعي                                                  │
│ لجنة الذكاء الاصطناعي  (نشطة)                          [ + إضافة عضو ] [ تعديل ] ⋮   │
│ AI Committee · ai                                                                  │
│ [ الأعضاء والمناصب 19 ] [ الفعاليات ] [ المقالات ] [ سجل المناصب ]                     │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ العضو                 المنصب            من           إلى           ⋮          │ │
│ │──────────────────────────────────────────────────────────────────────────────│ │
│ │ (ج) هيا المالكي         (قائدة اللجنة)     سبت 2025     —             ⋮          │ │
│ │ (س) سارة العتيبي        (عضو لجنة)        أكت 2025     —             ⋮          │ │
│ │ (ن) نورة سالم           (عضو لجنة)        أكت 2025     يونيو 2026  ⏳ تنتهي قريبًا │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Add member / assign position drawer

```
┌──────────────────────────────────────────────────────┐
│ تعيين منصب في لجنة الذكاء الاصطناعي                ✕ │
│ العضو *   [ 🔍 ابحث عن عضو نشط…        ]              │
│           (س) سارة العتيبي · جامعة نورة               │
│ المنصب *  ( ● عضو لجنة ) ( ○ نائب القائد ) ( ○ القائد ) │
│           ⓘ «القائد» متاح لقيادة المجتمع فقط            │
│ اللقب المعروض (اختياري) [                      ]       │
│ من *  [ ٢/١٠/٢٠٢٦ ]    إلى [            ] (مفتوحة)      │
│ ⚠ للجنة قائدة حالية (هيا المالكي). سيتطلب التعيين إنهاء   │
│   فترتها أولًا.  [ إنهاء الفترة الحالية وتعيين ]          │
│ ────────────────────────────────────────────────── │
│ [ إلغاء ]                          [ تعيين ]          │
└──────────────────────────────────────────────────────┘
```

### 1.4 End-term dialog

```
        ┌──────────────────────────────────────────┐
        │ إنهاء فترة نورة سالم (عضو لجنة)          ✕ │
        │ تاريخ الانتهاء * [ اليوم ▾ ]                │
        │ السبب * [                              ]   │
        │ ⓘ يبقى المنصب في السجل التاريخي             │
        │         [ تراجع ]   [ إنهاء الفترة ]        │
        └──────────────────────────────────────────┘
```

---

## 2. Layout rules

- **List** — committee cards (name ar/en, head, deputy, active members count, events this year, status chip). Inactive committees grouped under a collapsed "غير النشطة" section. A **Community leadership** strip lists global positions (founders, leader, advisor) with *Assign position* (`roles.assign`).
- **Committee detail** — header with status and actions; tabs: *Members & positions* (active assignments; sort by role rank then start date), *Events* and *Articles* (filtered lists linking to their screens), *Position history* (ended terms, append-only).
- **Assign drawer** — member search returns **active members only** (BR-ORG-004); role options filtered by the actor's grantable roles (anti-escalation); the one-head rule is surfaced **before** submit with the "end current term and appoint" option; terms with end dates show "⏳ تنتهي قريبًا" within 30 days.
- **Committee heads** see only their committee detail (sidebar *Committee members*), can add/end `committee_member` (and deputy if allowed — *Q-014*); they cannot appoint heads or edit the committee itself.
- **Edit committee** (drawer): names, slug, description, order, contact email; *Deactivate* in kebab with confirmation (events/articles remain).

## 3. States

- **Loading** — 6 card skeletons; detail: header + tabs + table skeleton.
- **No members** — EmptyState with *Add member*.
- **Constraint violations** — `ONE_HEAD_ONLY`, `NOT_A_MEMBER`, `ESCALATION_DENIED` mapped to inline messages in the drawer.
- **Public effect hint** — after assigning or ending a public position, toast: "سيظهر التغيير في صفحة الأعضاء العامة".

## 4. Data & permissions

- Read: `listCommittees()`, `getCommittee(id)`, `listAssignments({ committeeId, active })`.
- Actions: `createCommittee`, `updateCommittee`, `setCommitteeStatus`, `assign_role(...)`, `end_role_assignment(id, reason, endsAt)`.
- Permissions: `committees.manage`, `roles.assign`, `committee_members.manage` (scoped), `roles.view`.
- Requirements: FR-CMT-001…005, FR-PUB-003; BR-ORG-001…007.
