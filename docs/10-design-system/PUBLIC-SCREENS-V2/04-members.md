# 04 — Members `/members` and `/members/[id]` ★

**Purpose.** Show the people behind SDC: who leads it, and who's in it, **only as far as each person chose to be shown**. Privacy outranks completeness on every screen here.

## 1. Privacy rules (apply before any design rule)

1. The directory reads **only** `member_directory` (active members with `is_directory_visible = true`). A member who isn't listed doesn't exist publicly: `/members/[id]` returns 404 and the search never finds them.
2. **No contact details**, ever: no e-mail and no phone. Links (portfolio, GitHub, LinkedIn, X) show only the ones the member filled in, and only while listed.
3. Per-field consent: today one flag (`is_directory_visible`) controls the whole public card. The brief asks that track and university show **only when the member made them public**, so the design assumes per-field flags (Q-M1). Until they exist, those fields show for listed members, which is what the listing consent covers today.
4. Photos: the directory has **no photo column** today, so cards use initials. A photo appears only after an opt-in photo field exists (Q-M2).
5. The leadership section reads `current_positions` (public roles with a public bio the person approved).
6. "Events the member took part in" is participation data, so it is **off by default** and needs its own opt-in (Q-M3). "Articles" are public authorship, so they show when the member is a listed author.

## 2. Directory `/members` — wireframe (RTL)

```text
 الرئيسية › الأعضاء
 الأعضاء                                                                     t-h1
 تعرّف على أعضاء المجتمع وقادته.                                                t-lede
 ─────────────────────────────────────────────────────────────────────────────────────────
 ●● قيادة المجتمع                                                 (from current_positions)
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │ (◯) name     │ │ (◯) name     │ │ …            │ │ …            │   leader, advisor, founders
 │ role title   │ │ role title   │                                      then committee leads
 │ 2-line bio   │ │ 2-line bio   │                                      grouped by committee
 └──────────────┘ └──────────────┘
 ─────────────────────────────────────────────────────────────────────────────────────────
 ●● دليل الأعضاء
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 🔍 ابحث بالاسم…                       │ اللجنة ▾ │ المسار ▾ │ الجامعة ▾                   │
 └────────────────────────────────────────────────────────────────────────────────────────┘
 (المسار: علم البيانات ✕)  مسح الكل                                         48 عضواً
 ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
 │  (◯)    │ │  (◯)    │ │  (◯)    │ │  (◯)    │   member card: avatar 72, name, track (accent-text),
 │ name    │ │ name    │ │ name    │ │ name    │   role badge (if any), round arrow → profile
 │ track   │ │ track   │ │ track   │ │ track   │   4 / 3 / 2 / 1 columns
 │ (role)  │ │         │ │ (role)  │ │         │
 │     (←) │ │     (←) │ │     (←) │ │     (←) │
 └─────────┘ └─────────┘ └─────────┘ └─────────┘
                         ( عرض المزيد )                                    24 per page
 ─────────────────────────────────────────────────────────────────────────────────────────
 CTA band: لست عضواً بعد؟ انضم إلينا   ( قدّم طلب العضوية )       (hidden for signed-in members)
```

### Behaviour

| Element | Rule |
| ------- | ---- |
| Leadership | `current_positions`, ordered by role order then committee order. Card: avatar (initials), display name, role title, 2-line public bio, committee chip. Not linked unless that person is also listed in the directory. |
| Search | Name in both languages, server-side, `?q=` |
| Filters | Committee (public committees; needs committee membership in the directory view, Q-M4), track (`tracks`), university (`universities`). In the URL; bottom sheet on phones. |
| Sort | Leadership is a separate section; the directory is alphabetical by the name in the page language (falls back to the Arabic name) |
| Count | "‹n› عضواً / ‹n› members", live polite |
| Paging | "عرض المزيد / Load more", 24 |

### States

| State | UI |
| ----- | -- |
| Loading | 4 leadership skeletons + 8 member-card skeletons |
| No leadership data | Leadership section hidden |
| Empty directory | EmptyState "لم يُدرج أي عضو في الدليل بعد / No members are listed yet" + "قدّم طلب العضوية" (signed out) |
| No results | EmptyState "لا أعضاء يطابقون بحثك / No members match your search" + "مسح الفلاتر / Clear filters" |
| Error | EmptyState error + retry |

## 3. Profile `/members/[id]` — wireframe (RTL)

```text
 الرئيسية › الأعضاء › ‹name›
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │  (◯ 120)   ‹name›                                         t-h1                           │
 │            ‹track› · ‹status: طالب / خريج / موظف›          accent-text · muted            │
 │            🎓 ‹university› · ‹major›                     (only if public)                │
 │            [ in ] [ GitHub ] [ X ] [ 🔗 ]                  only the links that exist      │
 │                                                    ( تعديل ملفي )  ← own profile only     │
 └────────────────────────────────────────────────────────────────────────────────────────┘
 ●● نبذة
 ‹bio, ≤ 70ch›
 ●● اللجان والأدوار                         (current_positions for this person; Q-M4 for plain membership)
 ( لجنة التقنية · قائد اللجنة )  ( … )
 ●● المقالات                                  article list cards (public_articles by author)
 ●● الفعاليات التي شارك فيها                    (opt-in only, Q-M3) event list cards, "مقدّم" / "حاضر"
 ─────────────────────────────────────────────────────────────────────────────────────────
 ← العودة إلى دليل الأعضاء
```

Phone: the identity block is centred (avatar, then name, then track), links in a row, then the sections stacked.

### States

| State | UI |
| ----- | -- |
| Loading | Identity skeleton (circle + 3 lines) + 2 section skeletons |
| Not listed / unknown / inactive | **404** (the same page as any unknown URL) |
| No bio / no links / no articles | That block is omitted (no "—" or "لا يوجد") |
| Own profile | "تعديل ملفي / Edit my profile" (secondary) → `/account/member-profile`; a quiet note "هكذا يرى الزوار ملفك / This is how visitors see your profile" |
| Old numeric URL `/members/4` | Redirects to the public id only while the member is listed; otherwise 404 |

## 4. Data

| Need | Source | Gap |
| ---- | ------ | --- |
| Directory rows | `member_directory` | Per-field flags (Q-M1), opt-in photo (Q-M2), committee membership (Q-M4) |
| Leadership | `current_positions` | — |
| Filters | `tracks`, `universities`, `committees` | — |
| Profile | `member_directory` by id | The profile uses the member `id` (uuid) today: not enumerable, OK |
| Articles | `public_articles` joined through `article_authors` → `profiles` → `members.user_id` | Needs a public view `member_public_articles` that exposes only article ids for listed members |
| Events taken part in | `attendance_records` / `event_presenters` | Opt-in flag (Q-M3) and a public view limited to it |

## 5. Media

`M-20` member photos (1:1, opt-in, uploaded by members; initials until then), `M-21` leadership photos (1:1, consent per person; initials until supplied).
