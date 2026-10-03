# New Public Pages (Later Phases)

These pages don't exist yet. Each one is composed **only** from existing public patterns: the page banner, the centered auth-style card, detail cards, capsule buttons and tag pills. No new visual language.

| # | Route | Phase | Pattern reused |
| - | ----- | ----- | -------------- |
| 1 | `/join` | 3B | Full blueprint: [INTERNAL-SCREENS/25-join-page](../INTERNAL-SCREENS/25-join-page.md) |
| 2 | `/events/[slug]/check-in` | 4 | Auth-style centered card |
| 3 | `/certificates/[id]` | 4–5 (**Q-020**) | Banner + one detail card |
| 4 | `/privacy` | 5 (**Q-031**) | Banner + article-detail content card |
| 5 | `/search` | 3C | Banner + mixed result list (home "threads" rows) |

---

## 1. `/join`

See [25-join-page](../INTERNAL-SCREENS/25-join-page.md). It covers the closed / upcoming / open / already-applied states and the 5-step application form, all in the public visual language. The header gets a *انضم إلينا* nav link only while a cycle is open or upcoming (needs design sign-off).

## 2. Event check-in (`/events/[slug]/check-in`)

```
               ← العودة للفعالية
        ┌──────────────────────────────────────┐
        │              ( ✓ )                   │  icon 48px, accent
        │        تم تسجيل حضورك                 │
        │   معسكر الأمن السيبراني — اليوم 3       │
        │   الثلاثاء ١٧ سبتمبر · 18:04            │
        │ [        العودة لصفحة الفعالية       ] │  outline capsule
        └──────────────────────────────────────┘
```

| State | Card content |
| ----- | ------------ |
| Valid QR token / online window open | ✓ تم تسجيل حضورك |
| Online, no token, session open | Title + *تسجيل حضوري* primary capsule |
| Already checked in | ✓ (neutral) حضورك مسجّل مسبقًا |
| Session not open | ⏱ الجلسة غير مفتوحة الآن — يفتح المنظم التسجيل في وقت الفعالية |
| Token expired | ⟳ انتهت صلاحية الرمز — امسح الرمز المعروض الآن |
| Not accepted | ⓘ التسجيل في الحضور متاح للمقبولين فقط |
| Signed out | Redirect to `/login?redirect=…` (the token is kept) |

Logic: `check_in()` ([events entities §9](../../05-database/entities/events.md#9-functions)); screen counterpart: [16-event-attendance §5](../INTERNAL-SCREENS/16-event-attendance.md#5-participant-check-in-eventsslugcheck-int).

## 3. Certificate verification (`/certificates/[id]`) — **OPEN Q-020**

```
│ BANNER   الرئيسية › التحقق من شهادة                                   │
│          شهادة حضور ✓ صالحة                                          │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ الاسم           «recipient name»                                  │ │
│ │ الفعالية         معسكر الأمن السيبراني                             │ │
│ │ التاريخ          ١٥–١٩ سبتمبر ٢٠٢٦                                  │ │
│ │ نسبة الحضور      ٩٠٪                                               │ │
│ │ رقم الشهادة      «uuid» (ltr, monospace digits)                   │ │
│ │                                     [ تنزيل الشهادة PDF ]          │ │
│ └──────────────────────────────────────────────────────────────────┘ │
```

Unknown id → the 404 page. The download is visible to the owner only; others see the verification facts only.

## 4. Privacy notice (`/privacy`) — **OPEN Q-031**

Banner "سياسة الخصوصية" + the article content card from [06-article-detail](./06-article-detail.md) (Markdown). It is linked from the footer and from the register, join and registration dialogs.

## 5. Search results (`/search`)

```
│ BANNER   نتائج البحث عن «nextjs»                                      │
│ [ الكل ] [ الفعاليات (2) ] [ الثريدات (3) ] [ الأعضاء (4) ]            │  text tabs
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ (فعالية) ورشة Next.js والذكاء الاصطناعي                         ‹ │ │  home "threads" row style
│ │ (ثريد)   هندسة الأوامر                                          ‹ │ │  + a small type pill
│ └──────────────────────────────────────────────────────────────────┘ │
│ Empty: لا توجد نتائج مطابقة — جرّب كلمة أخرى                            │
```

Until this page exists, the header search button must be hidden or limited to members filtering ([00-public-chrome §3](./00-public-chrome.md#3-states)).
