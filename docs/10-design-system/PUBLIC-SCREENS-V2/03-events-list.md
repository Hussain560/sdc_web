# 03 — Events `/events`

**Purpose.** Find an event worth attending: what's open now first, then the rest, filterable in one row.

## Wireframe — desktop (RTL)

```text
 الرئيسية › الفعاليات
                                  الفعاليات                                   t-h1, centred
        ورش ولقاءات وهاكاثونات مفتوحة، حضورياً وعن بُعد.                       t-lede, centred
 [ القادمة | السابقة ]                                                        segmented, centred
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │ 🔍 ابحث عن فعالية…                     │ النوع ▾ │ الحضور ▾ │ اللجنة ▾               │  filter bar
 └──────────────────────────────────────────────────────────────────────────────────────┘
 (حضوري ✕) (ورشة ✕)   مسح الكل                                         12 فعالية     ← live
 ┌────────────┐ ┌────────────┐ ┌────────────┐
 │ event card │ │ event card │ │ event card │       grid 3 / 2 / 1
 └────────────┘ └────────────┘ └────────────┘
 …
                         ( عرض المزيد )                                   load more (12 per page)
```

Phone: the title and lede start-aligned, the segmented control is full width, then the search + "الفلاتر (n)" button opening a bottom sheet, then cards stacked.

## Behaviour

| Element | Rule |
| ------- | ---- |
| Segment "القادمة / Upcoming" (default) | Phases `announced`, `registration_open`, `registration_closed`, `in_progress`; sorted by `start_date` ascending; events open for registration come first within the same week |
| Segment "السابقة / Past" | `ended`, `completed`, `archived`, `cancelled`; sorted by last date descending |
| Search | Title and summary (both languages); server-side `ilike` on `public_events`; debounced 300 ms; `?q=` |
| Filters | Type (`workshop`, `bootcamp`, `hackathon`, `meeting`, `meetup`, `talk`), attendance (حضوري / عن بُعد / مدمج — `location_mode`), committee (public committees). All in the URL (`?type=&mode=&committee=&tab=`) and rendered on the server. |
| Count | "‹n› فعالية / ‹n› events" in `aria-live="polite"` |
| Pagination | "عرض المزيد / Load more", 12 at a time; the URL keeps `?page=` so the back button restores the position |

## States

| State | UI |
| ----- | -- |
| Loading | 6 event-card skeletons |
| Empty upcoming | EmptyState "لا توجد فعاليات قادمة الآن / No upcoming events right now" + "تصفّح الفعاليات السابقة / Browse past events" (switches the segment) |
| No results | EmptyState "لا فعاليات تطابق بحثك / No events match your search" + "مسح الفلاتر / Clear filters" |
| Error | EmptyState error + "إعادة المحاولة / Try again" |

## Data

`public_events` (`listPublicEvents`, extended with filters and paging), `committees` for the committee filter. The card uses `PublicEventCard` (title, place or online, dates, phase, cover, seats left).

## Media

`M-12` event covers (per event), `M-14` default cover.
