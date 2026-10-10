# 01 — Home `/` ★

**Purpose.** It tells a first-time visitor who SDC is in one sentence, shows what's happening next, and gives one clear way in ("Join us"), or one clear next step ("Register") when an event is open. The sections read as one story: **who we are → what's on → why join → who's with us → join → what you still wonder.**

## Wireframe — desktop (1440, RTL)

```text
╭─ header ──────────────────────────────────────────────────────────────────────────────────╮
╰───────────────────────────────────────────────────────────────────────────────────────────╯
 ① ANNOUNCEMENT STRIP (only when an event has registration open)
 ( ✓ التسجيل مفتوح )  ورشة بناء واجهات متجاوبة            ⟨ 14 أكتوبر ⟩                  ← │
──────────────────────────────────────────────────────────────────────────────────────────────
 ② HERO                                                    (glow + capsule-pair behind art)
                                 ┃  مجتمعٌ يبني                                    t-display
   [ SDC mark art ]              ┃  المطوّر السعودي                                 ≤ 18ch
   hero-mark-dark/light          ┃  ‹PLACEHOLDER: one-sentence lede, ≤ 60ch›         t-lede
                                 ┃  ( انضم إلى المجتمع )   تصفّح الفعاليات ←          1 primary + 1 link
 ─────────────────────────────────────────────────────────────────────────────────────────
   ‹N› عضو   │   ‹N› فعالية   │   ‹N› لجان   │   ‹N› شهادة               ③ STATS ROW (real data)
──────────────────────────────────────────────────────────────────────────────────────────────
 ④ UPCOMING EVENTS                                                    ●● الفعاليات القادمة
 ( عرض كل الفعاليات ← )                               ورش ولقاءات مفتوحة، حضورياً وعن بُعد.
 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │ event card   │  │ event card   │  │ event card   │      3 nearest upcoming published
 └──────────────┘  └──────────────┘  └──────────────┘
──────────────────────────────────────────────────────────────────────────────────────────────
 ⑤ WHY JOIN (band)                                                          ●● لماذا تنضم؟
                                               ‹PLACEHOLDER: lede› [للأعضاء | للشركاء] segmented
 ╭────────────────╮ ╭──────────╮ ╭──────────╮
 │ CTA card (tall)│ │ benefit  │ │ benefit  │      bento: 4 feature cards + 1 tall CTA card
 │ ابدأ رحلتك…     │ ╰──────────╯ ╰──────────╯
 │ (قدّم طلب العضوية)│ ╭──────────╮ ╭──────────╮
 ╰────────────────╯ │ benefit  │ │ benefit  │
                    ╰──────────╯ ╰──────────╯
──────────────────────────────────────────────────────────────────────────────────────────────
 ⑥ LATEST ARTICLES                                                        ●● أحدث المقالات
 ( كل المقالات ← )
 ┌───────────────────────┐   ┌───────────────────────────────────────────────┐
 │ featured article      │   │ list card · title · 2-line excerpt · date (←) │
 │ (cover 3:4, title on  │   ├───────────────────────────────────────────────┤
 │  a surface strip)     │   │ list card                                     │
 └───────────────────────┘   ├───────────────────────────────────────────────┤
                             │ list card                                     │
                             └───────────────────────────────────────────────┘
──────────────────────────────────────────────────────────────────────────────────────────────
 ⑦ PARTNERS (band, only with ≥ 1 active partner)                              ●● شركاؤنا
   [logo] [logo] [logo] [logo] [logo] [logo]   (marquee + pause when they overflow)
──────────────────────────────────────────────────────────────────────────────────────────────
 ⑧ CTA BAND                    انضم إلى المجتمع                   ( قدّم طلب العضوية )
                               (line depends on the intake phase)
──────────────────────────────────────────────────────────────────────────────────────────────
 ⑨ FAQ (5 items, centred title)                                    الأسئلة الشائعة
   ▸ accordion …                                                   كل الأسئلة ←  (when /faq exists)
╭─ footer ──────────────────────────────────────────────────────────────────────────────────╮
```

## Wireframe — phone (360)

```text
[header 56]
(announcement: one line, ellipsis, whole bar is the link)
مجتمعٌ يبني
المطوّر السعودي            t-display at 40px, 2–3 lines
lede
[   انضم إلى المجتمع   ]    full width
تصفّح الفعاليات ←
[ art at 60% width ]
‹N› عضو  │ ‹N› فعالية       stats 2 × 2
‹N› لجان │ ‹N› شهادة
●● الفعاليات القادمة
[event card] × 3 (stacked)
[ عرض كل الفعاليات ]       full-width secondary
why join: segmented → 4 feature cards stacked → CTA card
articles: featured → 3 list cards
partners: 2-column wrapped logos (no marquee)
CTA band
FAQ
[footer]
```

## Sections

| # | Section | Pattern / components | Content rules |
| - | ------- | -------------------- | ------------- |
| ① | Announcement strip | [Hero §1](../patterns.md#1-hero) strip | The **nearest** event in `registration_open`; the status pill, title and date chip. Hidden if none. |
| ② | Hero | Hero, Button, TextLink | **Display headline + lede are owner copy** (Q-H1). Primary: "انضم إلى المجتمع / Join the community" → `/join`. Link: "تصفّح الفعاليات / Browse events" → `/events`. Art: `M-01`/`M-02`. |
| ③ | Stats row | StatsRow | 3–4 figures **from data only** (Q-H2): e.g. published events (`count(public_events where phase in ended, completed)`), active directory members, committees, certificates issued. Any figure without a source is dropped; with fewer than 3 the row is hidden. |
| ④ | Upcoming events | SectionHeader, EventCard grid | The 3 nearest `public_events` with phase `announced`, `registration_open` or `registration_closed` and a future last date, sorted by `start_date`. With none: the 3 latest ended, titled "فعاليات سابقة / Past events". With no events at all: hidden. |
| ⑤ | Why join | SegmentedToggle, FeatureCard bento, CTA card | 4 benefits per audience ("للأعضاء / For members", "للشركاء / For partners"). **Benefit copy is the owner's** (Q-H3). The CTA card follows the intake phase (see States). Icons from the [core vocabulary](../foundations/motion-icons-focus.md#2-iconography). |
| ⑥ | Latest articles | Featured card + list cards | The 4 latest `public_articles`: the first is featured (cover required; otherwise all 4 are list cards). Hidden with none. |
| ⑦ | Partners | Partner strip | Active `partners` ordered by `display_order`; logo `alt` = the partner name; links to `website_url` (external). Hidden with none (Q-021). |
| ⑧ | CTA band | CtaBand | Text and action by intake phase (below). |
| ⑨ | FAQ | Accordion | 5 questions from the message catalogue (`home.faq.*`); **copy is the owner's** (Q-H4). The link to the full FAQ appears once the [FAQ page](./20-suggested-additions.md) exists. |

Removed from the current home: the "community sections" tiles (they become the committees index, [08](./08-committees.md)), the hard-coded members strip (replaced by the stats row and the directory), and the threads column (now ⑥).

## States

| State | Effect |
| ----- | ------ |
| Loading | Server-rendered. Streaming sections show their skeleton (3 event cards, 1 featured + 3 list cards) |
| Intake **open** (`membership_cycle_phase.phase = open`) | Hero primary and CTA: "قدّم طلب العضوية / Apply for membership"; CTA line "باب العضوية مفتوح حتى ‹date› / Applications are open until ‹date›" |
| Intake **scheduled** | Primary "انضم إلى المجتمع / Join the community" → `/join`; CTA line "يفتح باب العضوية في ‹date› / Applications open on ‹date›" |
| Intake **closed / none** | Primary stays "Join the community" → `/join`; CTA line "تابعنا لتعرف موعد الدورة القادمة / Follow us to hear when the next intake opens" + social links |
| Signed-in member | Hero primary becomes "تصفّح الفعاليات / Browse events"; the why-join and CTA bands are hidden (they're already in) |
| No upcoming events | ④ shows past events, or hides; ① hidden |
| No articles / partners / stats | That section is hidden; neighbouring sections close the gap (never two bands in a row: ⑦ hidden → ⑧ keeps its band, and ⑤ keeps its band only if ⑥ exists) |
| Error in one block | The block is hidden and logged; the page never shows a raw error |

## Copy (key strings)

| Key | Arabic | English |
| --- | ------ | ------- |
| `home.hero.title` | ‹PLACEHOLDER: owner headline› (design sample: مجتمعٌ يبني المطوّر السعودي) | ‹PLACEHOLDER› (sample: A community that builds Saudi developers) |
| `home.hero.lede` | ‹PLACEHOLDER› — the approved tagline can stand in: نبني مجتمعاً سعودياً يقود المستقبل بالذكاء الاصطناعي والتقنيات الحديثة. | We build a Saudi community that leads the future with AI and modern technologies. |
| `home.events.title` / `lede` | الفعاليات القادمة / ورش ولقاءات مفتوحة، حضورياً وعن بُعد. | Upcoming events / Open workshops and meetups, in person and online. |
| `home.events.all` | عرض كل الفعاليات | View all events |
| `home.why.title` | لماذا تنضم؟ | Why join? |
| `home.articles.title` | أحدث المقالات | Latest articles |
| `home.partners.title` | شركاؤنا | Our partners |
| `home.cta.title` | انضم إلى المجتمع | Join the community |
| `home.faq.title` | الأسئلة الشائعة | Frequently asked questions |

## Media

`M-01` hero art (dark), `M-02` hero art (light), `M-10` featured article covers (from articles), `M-30` partner logos (from `partners`). Optional later: `M-03` a hero photo of a real SDC event (would replace the art).

## Data gaps

Stats sources (Q-H2) and owner copy for the hero, benefits and FAQ (Q-H1, Q-H3, Q-H4).
