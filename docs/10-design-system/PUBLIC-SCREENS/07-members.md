# Members — `/members` (and `/members/all`)

`app/members/page.tsx` + `members.css`. The leadership sections are hardcoded; the directory section reads the `members` table from Supabase on the client. `/members/all` re-exports the same page.

---

## 1. Blueprint

### Desktop (1440px, RTL)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ BANNER BOX (image banner 1377×146, radius 20, inside the container)                        │
│   الرئيسية › الأعضاء                                                                       │
│   أعضاء المجتمع السعودي للمطورين (SDC)                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                   مؤسِّستا المجتمع               (section heading, centered)│
│          ┌──────────────────────────────┐  ┌──────────────────────────────┐                │
│          │ (ر)  رغد «founder»            │  │ (ه)  هيا «founder»            │  371×170       │
│          │ أسّست المجتمع السعودي…         │  │ أسّست المجتمع السعودي…         │                │
│          │ (تأسيس) (رؤية)                │  │ (تأسيس) (رؤية)                │                │
│          └──────────────────────────────┘  └──────────────────────────────┘                │
│                                 قائد المجتمع والمستشار                                      │
│          ┌──────────────────────────────┐  ┌──────────────────────────────┐                │
│          │ (ف)  فيصل                     │  │ (د)  دانة                     │                │
│          │      قائد المجتمع             │  │      المستشار                 │                │
│          │ قائد المجتمع الحالي، يقود…     │  │ قائدة المجتمع سابقًا…          │                │
│          │ (قيادة) (استراتيجية)          │  │ (استشارة) (خبرات)             │                │
│          └──────────────────────────────┘  └──────────────────────────────┘                │
│                                      قادة المجتمع                                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  328×98      │
│  │ (ل) لمى         │ │ (…) …          │ │ …              │ │ …              │  4 per row   │
│  │ قائدة لجنة الذكاء│ │ قائدة لجنة الأمن│ │                │ │                │  × 2 rows    │
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘              │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ [ ⚙ التخصيص ]                                                           أعضاء المجتمع   │
│                                     تعرّف على أعضاء مجتمعنا الذين يجمعهم الشغف بالتقنية…  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  328×238     │
│  │ (س)             │ │                │ │                │ │                │              │
│  │ سعود محمد        │ │  … directory   │ │                │ │                │              │
│  │ علوم حاسب        │ │    cards       │ │                │ │                │              │
│  │ 🎓 جامعة الملك سعود│ │                │ │                │ │                │              │
│  │ (علوم حاسب)(هندسة…)(تطوير الويب) │                │ │                │              │
│  │ [ المعلومات المهنية ↗ ]           │                │ │                │              │
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Filter panel (opens from *⚙ التخصيص*, 407×350, anchored under the button)

```
┌───────────────────────────────────┐
│ التخصيص                         ✕ │
│ الجامعة          [            ▾ ] │
│ التخصص           [            ▾ ] │
│ التخصص الدقيق     [            ▾ ] │
│ الحالة الدراسية   [            ▾ ] │
│ المسار           [            ▾ ] │
│ [ إعادة تعيين ]         [ تطبيق ]  │
└───────────────────────────────────┘
```

### Mobile (375px)
Banner → each section stacks into 1 column → the filter button sits above the title → the panel opens full width.

---

## 2. Layout rules (CURRENT — keep)

- **Leadership cards:** a 52px initial avatar (green tint) at the inline start, then name (+ role), bio and tag pills. The founders and leader/advisor grids are 2 centered cards (760px total).
- **Committee leads:** 4-column grid of compact cards (avatar + name + role).
- **Directory cards:** avatar, name, major as the role line, a university line with an icon, skill pills (the track uses the `tag-green` variant), and a *المعلومات المهنية* link (LinkedIn/portfolio) at the bottom.
- **Directory skeleton:** `.sdc-skel` blocks (52px circle, 3 lines, 2 pills, a 38px capsule). This is the **reference skeleton style for all public pages**.
- The header search (`onSearch`) filters the directory by name in place.

## 3. States

| State | CURRENT | TARGET (same look) |
| ----- | ------- | ------------------ |
| Loading | 8 skeleton cards | Same |
| Empty (filters) | — | "لا يوجد أعضاء مطابقون — [إعادة تعيين الفلاتر]" |
| Error | Console only | Muted message + *إعادة المحاولة* |
| Directory visibility | Everyone in `members` | Only active members who **opted in** (**OPEN Q-007**); no email or phone ever |
| Pagination | All rows | Load more (24 per page) as an outline capsule under the grid |

## 4. Data

| Section | CURRENT | TARGET |
| ------- | ------- | ------ |
| Founders, leader/advisor, committee leads | Hardcoded arrays (real names) | `current_positions` view (public positions with active terms) — Phase 2 ([organization entities](../../05-database/entities/organization.md)) |
| Directory | `supabase.from('members').select('*')` from the browser (open RLS) | `member_directory` view (public columns only) |
| Filter options | Distinct values computed from the loaded rows | Reference tables `universities`, `majors`, `tracks` |

## 5. Known issues

- The page reads **all columns** of `members`, including private ones, with the anon key (audit critical finding).
- Leadership names and roles are hardcoded and go stale every term.
- The "المعلومات المهنية" link opens raw user-entered URLs (validate `https://`).
