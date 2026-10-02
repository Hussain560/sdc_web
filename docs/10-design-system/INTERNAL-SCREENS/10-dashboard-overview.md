# Dashboard — Overview (Role-Aware Home)

`/dashboard` — the landing page after sign-in for every user. One page, assembled from **cards that render only when the user holds the related permission** ([03-conditional-rendering](./03-conditional-rendering.md)).

---

## 1. Blueprint — community leader (most cards visible)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  الرئيسية › لوحة التحكم                                                        │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ (م)  أهلًا فيصل 👋                                     قائد المجتمع        │ │
│  │      الخميس، ٢ أكتوبر ٢٠٢٦ · دورة استقبال العضوية مفتوحة حتى ٣٠ أكتوبر  →  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ الأعضاء النشطون │ │ فعاليات قادمة  │ │ طلبات بانتظار  │ │ تسجيلات معلقة  │       │
│  │    312         │ │      4        │ │  القرار  41   │ │      27       │       │
│  │ +18 هذه الدورة │ │ 2 بالتسجيل     │ │ ⚠ يحتاج إجراء │ │ في 3 فعاليات   │       │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │
│                                                                                │
│  ┌────────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ بانتظار إجرائك                       │  │ الفعاليات القادمة                  │ │
│  │ ────────────────────────────────── │  │ ──────────────────────────────── │ │
│  │ 🗓 فعالية: ورشة Next.js     اعتماد → │  │ ١٠ نوفمبر  ورشة Next.js          │ │
│  │ 📝 مقال: أنظمة التوصية     مراجعة → │  │            الذكاء · 48/60 مقبول   │ │
│  │ 👤 41 طلب عضوية          مراجعة →   │  │ ٢٥ أكتوبر  لقاء GitHub           │ │
│  │ ✉ 3 رسائل فشل إرسالها    عرض →      │  │            التقنية · التسجيل متاح │ │
│  └────────────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ نشاطي                                                                     │ │
│  │ تسجيلاتي القادمة: لقاء GitHub — مقبول ✓          [ عرض كل تسجيلاتي ]     │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Plain user / non-member

```
┌───────────────────────────────────────────────────────────────┐
│ (س)  أهلًا سارة                                                │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ ✦ استقبال طلبات العضوية مفتوح حتى ٣٠ أكتوبر               │ │  ← only while a cycle is open
│ │   انضم إلى المجتمع السعودي للمطورين.       [ قدّم الآن ]    │ │     and the user is not a member
│ └───────────────────────────────────────────────────────────┘ │
│ تسجيلاتي القادمة          الفعاليات المتاحة للتسجيل              │
│ (list, 3)                 (list, 3)  [ تصفح الفعاليات ↗ ]       │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **Welcome card** — `Card variant="accent-top"`: avatar initial on the green gradient (existing member-card style), greeting, today's date (Asia/Riyadh), and the user's primary position badge (highest-ranked active position; committee positions show the committee name). An optional context line surfaces the most important community state (open intake cycle, pending approvals).
- **Stat tiles** (`StatCard`, 4 per row on ≥ 1024px, 2 on tablet, 1 on mobile). Each tile is a link to its list, pre-filtered. Tile set by permission:
  | Tile | Needs | Links to |
  | ---- | ----- | -------- |
  | Active members (+ new this cycle) | `reports.view_community` | `/dashboard/members` |
  | Upcoming events (+ registration open) | `events.view_drafts` (scope-aware) | `/dashboard/events?period=upcoming` |
  | Applications awaiting decision | `membership.review` | `/dashboard/membership/applications?status=submitted` |
  | Pending registrations | `registrations.review` (scope-aware) | `/dashboard/registrations?status=pending` |
  | Drafts needing changes (committee) | `events.create` in scope | `/dashboard/events?status=changes_requested` |
  Tiles showing "awaiting you" counts use the warning tone when > 0.
- **"Awaiting your action"** card — a merged queue (max 6 rows) of items where *this* user can act now; each row: type icon, title, context, action link. Hidden when empty (replaced by a calm success line "لا توجد مهام بانتظارك / Nothing waiting for you").
- **Upcoming events** card — next 3 published events in scope with date, committee, phase chip, accepted/capacity.
- **My activity** card — every user: next registrations and membership status.
- **Membership CTA** — non-members only, while a cycle is open; links to `/join`.
- Founder/advisor: tiles + community charts snapshot (from reports), no action queue.

## 3. States

- **Loading** — skeleton §2.3 of [04-skeleton-loading](./04-skeleton-loading.md); each card is its own Suspense boundary so a slow count doesn't block the rest.
- **First-time user** — welcome card + "Explore events" CTA; no empty tiles.
- **Suspended member** — danger `Alert` under the welcome card with the reason and contact.
- **Error in one card** — inline retry inside that card.

## 4. Data & permissions

- `getDashboardSummary(access)` server function → only queries the sections the user may see.
- Counts come from views (`event_registration_counts`, application status counts) with RLS — a count can never include out-of-scope rows.
- Requirements: FR-RPT-003, FR-ADM-006.
