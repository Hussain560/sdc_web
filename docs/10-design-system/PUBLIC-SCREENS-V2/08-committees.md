# 08 — Committees `/committees` (proposed) and `/committees/[slug]`

**Purpose.** Show how SDC is organised and give each committee a home: what it does, who leads it, what it has run.

## 1. Index `/committees` — proposed (launch)

There is no index route today; the home "community sections" tiles become this page.

```text
 الرئيسية › اللجان
 اللجان                                                                      t-h1
 فرق تطوعية تقود عمل المجتمع، لكل منها مجال واضح.  ‹owner copy›                    t-lede
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │ [icon tile]  │ │ [icon tile]  │ │ …            │ │ …            │   committee card:
 │ name         │ │ name         │                                     icon, name, one-line purpose,
 │ one line     │ │ one line     │                                     lead (name, if public),
 │ ‹n› فعالية    │ │ ‹n› فعالية    │                                     events count, arrow
 │          (←) │ │          (←) │
 └──────────────┘ └──────────────┘
```

Data: `committees` (active, public columns), the lead from `current_positions`, the count from `public_events`. Icons: one lucide icon per committee chosen in the dashboard (Q-C1) or the default `UsersRound`.

## 2. Committee page `/committees/[slug]` (exists; redesigned)

```text
 الرئيسية › اللجان › ‹name›
 [icon tile 64]  ‹name›                                                       t-h1
                 ‹description›                                                 t-lede
 ●● القيادة       lead and members with public roles (current_positions)
 ●● الفعاليات     [القادمة | السابقة] → event cards of this committee
 ●● المقالات      article list cards of this committee
 CTA: هل تريد المساهمة في ‹name›؟ قدّم طلب العضوية واذكر اهتمامك.  ( قدّم طلب العضوية )
```

| State | UI |
| ----- | -- |
| No events / articles | That section shows a one-line empty text ("لا فعاليات قادمة لهذه اللجنة / No upcoming events from this committee") with a link to all events |
| Inactive or unknown committee | 404 |

Data: `getPublicCommittee(slug)` (committee, `current_positions`, `public_events`, `public_articles`).

## Media

`M-60` committee icons (lucide, no files needed), optional `M-61` a committee banner photo per committee (later).
