# Reports — Community & Committee Dashboards

`/dashboard/reports` (community) and `/dashboard/reports/committees/[id]` (committee). Read-only analytics derived from operational data ([reporting model](../../03-business-domain/reporting-model.md), metric set pending *Q-008*). Charts follow the dataviz rules: one accent series, neutral comparisons, labelled values.

---

## 1. Blueprint — community

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › التقارير                                                              │
│ تقارير المجتمع               الفترة: [ سنة العضوية 2026 ▾ ]  [ هذا الشهر ] [ مخصص ]  │
│                                                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ أعضاء نشطون   │ │ فعاليات أُقيمت │ │ تسجيلات       │ │ نسبة القبول    │ │ نسبة الحضور    │ │
│ │ 312  ▲ 6%     │ │ 11            │ │ 642          │ │ 81%          │ │ 74%          │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                                      │
│ ┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐   │
│ │ التسجيلات والحضور حسب الشهر            │ │ قمع طلبات العضوية — دورة 2026         │   │
│ │  ▇ ▇ ▆ █ ▅ ▇   (bars: registrations,  │ │ مقدمة 112 ▕██████████████          │   │
│ │  ─●─●─●─●─      line: attendance %)   │ │ مقبولة  64 ▕████████               │   │
│ │                                      │ │ انتظار  10 ▕█▌                      │   │
│ └──────────────────────────────────────┘ │ مرفوضة  31 ▕████                    │   │
│                                          └──────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────────────────────────────────┐   │
│ │ أداء اللجان                                                                    │   │
│ │ اللجنة          الأعضاء  الفعاليات  التسجيلات  القبول  الحضور  المقالات          │   │
│ │ الذكاء             18       4        210      83%     77%      5             │   │
│ │ الأمن              12       2         96      79%     70%      0             │   │
│ └──────────────────────────────────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐                  │
│ │ الأعضاء حسب الحالة الأكاديمية   │ │ أعلى الجامعات تمثيلًا            │                  │
│ └──────────────────────────────┘ └──────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Committee dashboard: same layout limited to one committee (tiles: committee members, events, registrations, acceptance, attendance; chart by event; events table; articles count).

## 2. Layout rules

- **Period selector** — membership year (between intake cycles, default — *Q-008*), month, custom range; in URL.
- **Stat tiles** — value + delta vs previous period (▲/▼ with text, not color alone); tiles link to filtered operational lists only if the user has the matching operational permission (otherwise not links).
- **Charts** — bars for counts, line for rates, horizontal funnel for applications; accent color for the primary series, neutral for others; values labelled; each chart has a "عرض كجدول / View as table" toggle for accessibility; empty periods show "لا توجد بيانات للفترة".
- **Committee table** — sortable columns, `tabular-nums`; rows link to committee dashboards.
- **Small groups** — aggregates under 5 people are shown as "<5" (RP-2 spirit applied internally for demographic breakdowns).
- **Read-only badge** for founders/advisor; no export by default (*Q-008*).

## 3. States

- **Loading** — reports skeleton §2.5 (tiles + 2 chart blocks + table); each chart is its own Suspense boundary.
- **Error in a widget** — inline retry; other widgets unaffected.

## 4. Data & permissions

- Read: `community_stats(period)`, `committee_stats(committeeId, period)` SQL functions (scope-checked).
- Permissions: `reports.view_community`; `reports.view_committee` (scoped).
- Requirements: FR-RPT-001, FR-RPT-002.
