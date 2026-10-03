# Administration — Users and Roles & Positions

`/dashboard/admin/users` and `/dashboard/admin/roles` — find any account and manage role assignments (positions) with the anti-escalation and last-admin guards. This is where the hardcoded `COMMITTEE_EMAILS` list is retired.

---

## 1. Blueprints

### 1.1 Users

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › إدارة النظام › المستخدمون                                             │
│ المستخدمون                                                                          │
│ [ 🔍 الاسم أو البريد… ]  [ النوع: الكل ▾ (عضو/غير عضو/لديه منصب) ]  [ أُنشئ ▾ ]       │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ المستخدم                     العضوية        المناصب                  آخر دخول  ⋮ │ │
│ │──────────────────────────────────────────────────────────────────────────────│ │
│ │ (ف) فيصل العمري             (عضو نشط)       (قائد المجتمع)           اليوم     ⋮ │ │
│ │     faisal@example.com                                                          │ │
│ │ (ه) هيا المالكي             (عضو نشط)       (قائدة · الذكاء)         أمس       ⋮ │ │
│ │ (أ) أحمد علي                 —               —                       قبل أسبوع  ⋮ │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

User drawer (row click): account (name, email, locale, created, email confirmed ✓, MFA ✓/—), membership card (link to member), positions list (active + past) with *Assign position*, registrations count, applications. Actions in kebab: *Assign position*, *Send password reset*, *View audit for this user*.

### 1.2 Roles & positions

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ … › الأدوار والمناصب                                         [ + تعيين منصب ]     │
│ [ المناصب الحالية ] [ السجل ] [ الأدوار والصلاحيات ]                                │
│ [ الدور: الكل ▾ ] [ اللجنة: الكل ▾ ] [ 🔍 ]                                         │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ المستخدم            الدور                 النطاق           من        إلى     ⋮ │ │
│ │──────────────────────────────────────────────────────────────────────────────│ │
│ │ (ن) نوف الحربي      (مدير النظام)          عام              ١ أكت     —       ⋮ │ │
│ │ (ف) فيصل العمري     (قائد المجتمع)         عام              سبت 2025  —       ⋮ │ │
│ │ (ه) هيا المالكي     (قائدة اللجنة)         الذكاء الاصطناعي  سبت 2025  —       ⋮ │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Assign position drawer

```
┌────────────────────────────────────────────────────────┐
│ تعيين منصب                                           ✕ │
│ المستخدم *  [ 🔍 … ]                                     │
│ الدور *     [ قائد اللجنة ▾ ]                            │
│             ⓘ يتطلب لجنة · يتطلب أن يكون عضوًا نشطًا       │
│ اللجنة *    [ الأمن السيبراني ▾ ]                         │
│ اللقب المعروض [               ]  ☐ يظهر في صفحة القيادة    │
│ من * [ اليوم ]  إلى [      ]                             │
│ ── الصلاحيات التي سيحصل عليها ──                          │
│ ✓ إنشاء الفعاليات · ✓ مراجعة التسجيلات · ✓ نشر المقالات … │
│ ────────────────────────────────────────────────────── │
│ [ إلغاء ]                                [ تعيين ]       │
└────────────────────────────────────────────────────────┘
```

### 1.4 Roles & permissions tab (read-only matrix)

A matrix of roles × permission groups (✅ / ◐ committee / —) generated from `role_permissions`, matching the [permission catalog](../../06-security/permission-catalog.md). Editing is a migration (no UI toggles) — the tab explains this.

---

## 2. Layout rules

- **Users table** — avatar initial, name + email (`dir="ltr"`), membership badge, position badges (max 2 + "+n"), last sign-in (relative), kebab. Search is server-side.
- **Assign drawer** — role list contains **only roles the actor may grant** (BR-ORG-006): system admins see all; the community leader sees committee roles (and not `system_admin`, `community_leader`, `founder`, `advisor`). Choosing a committee-scoped role reveals the committee select; member-only roles filter the user search to active members. A **permission preview** lists what the role grants (from data), so admins understand the consequence.
- **Guards surfaced in UI**: last active `system_admin` cannot be ended (end action disabled with reason); users cannot end/extend their own assignments (actions hidden on own rows); one-leader / one-head conflicts shown inline with the "end current term" option.
- **History tab** — ended assignments with end reason and actor; append-only.
- **MFA indicator** — system admins without MFA show a warning badge (*Proposed* admin MFA requirement).

## 3. States

- **Loading** — table skeleton (8 rows); drawer skeleton.
- **Assignment success** — toast; if the affected user is online, their menu updates on next navigation.
- **Errors** — `ESCALATION_DENIED`, `LAST_ADMIN`, `ONE_LEADER_ONLY`, `ONE_HEAD_ONLY`, `NOT_A_MEMBER`, `SELF_ASSIGNMENT` → inline drawer messages in the active language.

## 4. Data & permissions

- Read: `searchUsers(q, filters)`, `getUser(id)`, `listAssignments(filters)`, `rolePermissionMatrix()`.
- Actions: `assign_role`, `end_role_assignment`, `sendPasswordReset(userId)` (uses Auth; same generic flow).
- Permissions: `users.view`, `roles.view`, `roles.assign`.
- Requirements: FR-ADM-001, FR-ADM-002, FR-CMT-002; BR-ORG-006/007.
