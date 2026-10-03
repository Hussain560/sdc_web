# Conditional Rendering — Showing the Right UI for Each Role

How every internal screen decides what to show. The UI mirrors the authorization model; it never replaces it.

> **Rule zero:** hiding is UX. Every action shown here is enforced again by the Server Action (`requirePermission`) and by RLS. A crafted request for a hidden action must fail with `FORBIDDEN` ([authorization model §3](../../06-security/authorization-model.md#3-enforcement-layers)).

---

## 1. The access context

Computed once per request on the server in the `(internal)` layout and passed down (serializable):

```ts
// design contract
type AccessContext = {
  userId: string;
  displayName: string;
  locale: 'ar' | 'en';
  member: { status: 'active' | 'suspended' | 'inactive' } | null;  // null = not a member
  positions: Array<{                                                // active role assignments
    role: RoleKey; committeeId: string | null; committeeName?: Localized; title?: Localized;
  }>;
  grants: Record<PermissionKey, 'global' | string[]>;               // 'global' or list of committee ids
};

can(access, 'events.approve')                       // held anywhere (global or any committee)
can(access, 'registrations.review', committeeId)    // held globally or for that committee
canGlobal(access, 'events.view_drafts')             // held globally
isMember(access)                                    // active member
```

Client components receive `access` (or only the booleans they need) as props; a `<Can permission="…" scope={id}>` wrapper renders children only when allowed.

## 2. Decision rules

| Situation | UI behaviour | Example |
| --------- | ------------ | ------- |
| User lacks the permission entirely | **Hide** (nav item, button, column, tab, section) | A committee member never sees *Approve & publish* |
| User has the permission but the record's **state** forbids it | **Show disabled** with a tooltip/helper text giving the reason | *Complete event* disabled: "متاح بعد انتهاء الفعالية / Available after the event ends" |
| Permission exists but **scope** doesn't cover this record | Record not listed at all (RLS) — if opened by URL → 404 page | Head of AI opening a Cybersecurity draft |
| Ownership-based action (own registration, own application, own draft) | Show only on the owner's own record | *Withdraw application* |
| Self-conflict (reviewer is the subject) | Hide the decision actions + info note | A leader viewing their own membership application |
| Destructive or irreversible | Show behind `ConfirmDialog` naming the object | *Cancel event "ورشة …" (32 registrants will be emailed)* |
| Feature not yet available (deferred) | Do **not** render placeholders/"coming soon" in internal screens | Certificates |
| Read-only roles (founder, advisor) | Render the same screens without action bars; a subtle "عرض فقط / View only" badge in the page header | Founder on Members |

Never show a disabled control the user can *never* use — disabled means "you can, just not now".

## 3. Role → view matrix (defaults; see permission catalog)

✅ full · 👁 read-only · ◐ own committee · — hidden

| Screen | Plain user | Member | Cttee member | Cttee head/deputy | Leader | Founder | Advisor | Sys admin |
| ------ | :--------: | :----: | :----------: | :---------------: | :----: | :-----: | :-----: | :-------: |
| 10 Overview | ✅ (personal) | ✅ (personal) | ✅ + committee tiles | ✅ + queues | ✅ community | 👁 community | 👁 community | ✅ |
| 11 Account | ✅ | ✅ (+ member profile) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 Events list | — | — | ◐ | ◐ | ✅ | 👁 (*Q-032*) | — | ✅ |
| 13 Event form | — | — | ◐ drafts | ◐ | ✅ | — | — | ✅ |
| 14 Event detail/review | — | — | ◐ 👁 | ◐ | ✅ approve | 👁 | — | ✅ |
| 15 Registrations | — | — | — (grantable) | ◐ | ✅ | — | — | ✅ |
| 16 Attendance | — | — | ◐ | ◐ | ✅ | — | — | ✅ |
| 17 Intake cycles | — | — | — | — | ✅ | — | — | ✅ |
| 18 Applications | — | — | — | — (*Q-013*) | ✅ | — | — | ✅ |
| 19 Members | — | — | — | — | ✅ | 👁 | — | ✅ |
| 20 Committees | — | — | — | ◐ members tab | ✅ | 👁 | — | ✅ |
| 21 Articles | — | — | ◐ drafts | ◐ publish | ✅ | — | — | ✅ |
| 22 Reports | — | — | — | ◐ | ✅ | 👁 | 👁 | ✅ |
| 23 Users & roles | — | — | — | — | ◐ non-global roles | 👁 roles | — | ✅ |
| 24 Audit/emails/settings | — | — | — | — | ◐ emails/settings/ref data | — | — | ✅ |

## 4. Per-screen conditional elements (summary)

| Screen | Conditional elements |
| ------ | -------------------- |
| Overview | Tiles and queue cards per permission (e.g., "Pending approvals" card only with `events.approve`); membership CTA for non-members when a cycle is open |
| Events list | Committee filter shows only scoped committees; "New event" needs `events.create`; status tabs show counts only for visible rows |
| Event detail | Action bar from §00 §1.4 ∩ permissions; *Private details* card (meeting link) only with `events.edit`; review panel only for approvers when `pending_review` |
| Registrations | Decision checkboxes and bulk bar only with `registrations.review`; *Export* only with `registrations.export`; email column only with email-log access in scope |
| Applications | Decision actions hidden on the reviewer's own application; *Export* with `membership.export` |
| Members | Status actions only with `members.manage`; private columns (email/phone) only with `members.view` |
| Committees | *New committee* with `committees.manage`; *Add member* with `committee_members.manage` in scope; *Appoint head* only for actors allowed by anti-escalation |
| Users & roles | Role options in the assign drawer filtered to what the actor may grant; `system_admin` option only for system admins |

## 5. Forbidden and not-found presentation

```
┌──────────────────────────────────────────────────────────┐
│                         🛡                                 │
│            ليس لديك صلاحية للوصول إلى هذه الصفحة           │
│     You don't have access to this page.                    │
│                                                            │
│   إذا كنت تعتقد أن هذا خطأ، تواصل مع قيادة المجتمع.        │
│                                                            │
│        [ العودة إلى لوحة التحكم ]   [ الموقع العام ]       │
└──────────────────────────────────────────────────────────┘
```

- Rendered **inside the shell** (sidebar stays) for authenticated users on permission-gated routes (`forbidden()` / custom 403 view).
- For records outside the user's scope or non-existent: the localized **404** view (do not reveal existence).
- Never mention which permission is missing.

## 6. Accessibility of conditional UI

- Removing elements must not leave empty landmarks or orphan headings.
- Disabled controls use `aria-disabled="true"` (still focusable) + `aria-describedby` pointing to the reason, so keyboard and screen-reader users learn *why*.
- "View only" mode announces once via the page header badge, not on every control.
