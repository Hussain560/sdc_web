# 00 — Public Chrome: Header, Footer, Mobile Menu

**Purpose.** It gets visitors anywhere in two clicks, keeps one invitation ("Join us") visible, and stays out of the way of the content. It's used on every public page except the [auth layout](./05-auth.md).

## Wireframes

**Desktop (≥ 1024), floating header, RTL**

```text
 12px
╭───────────────────────────────────────────────────────────────────────────────────────────╮
│ [شعار SDC]   ( الرئيسية · الفعاليات · المقالات · الأعضاء · اللجان · من نحن )   🔍  English  ☀  ( انضم إلينا ) │
╰───────────────────────────────────────────────────────────────────────────────────────────╯
  inline-start                     nav pill                                       inline-end
```

- Inside `--container-wide`, 64 px tall, `--radius-xl`, `--surface` at 85% with a 12 px blur and a 1 px `--border`. It's sticky at `top: 12px`, and `--elev-2` appears after 8 px of scroll. It hides on scroll down and returns on scroll up (not under reduced motion).
- **Signed-in member:** "انضم إلينا" is replaced by an avatar button → menu: "حسابي / My account", "لوحة التحكم / Dashboard" (only if the user has any dashboard permission, from the database), "تسجيل الخروج / Sign out".

**Phone (< 1024)**

```text
┌────────────────────────────────────┐
│ [شعار]                    🔍   ☰    │  56px, full width, --surface, bottom --border
└────────────────────────────────────┘
          ☰ → bottom sheet:
┌────────────────────────────────────┐
│              ───                   │  handle
│ الرئيسية                           │  48px rows, current = --accent-soft + aria-current
│ الفعاليات                          │
│ المقالات                           │
│ الأعضاء                            │
│ اللجان                             │
│ من نحن                             │
│ ────────────────────────────────── │
│ English                    🌐      │
│ الوضع الفاتح               [◯  ]    │  switch
│ [        انضم إلينا        ]        │  primary, full width
│        دخول الأعضاء                 │  quiet link
└────────────────────────────────────┘
```

**Footer** — [component spec](../components.md#43-footer): a brand column (vertical logo + tagline), the community, events and contact columns, then a bottom bar (© year · privacy · member sign-in · language · theme). Columns become accordions below 768 px.

## Navigation items

| Arabic | English | Route | Notes |
| ------ | ------- | ----- | ----- |
| الرئيسية | Home | `/` | |
| الفعاليات | Events | `/events` | |
| المقالات | Articles | `/articles` | New in the nav; the route exists |
| الأعضاء | Members | `/members` | |
| اللجان | Committees | `/committees` | Proposed index ([08](./08-committees.md)); until it exists, omit the item |
| من نحن | About | `/about` | |

## States

| State | Behaviour |
| ----- | --------- |
| Signed out | "انضم إلينا / Join us" → `/join`; "دخول الأعضاء / Member sign-in" in the footer and the mobile sheet only (ADR-013) |
| Signed in | Avatar menu; dashboard entry only with a permission |
| Intake closed | "Join us" still goes to `/join`, which explains when applications open |
| Current page | `aria-current="page"` and the filled pill item |
| Search | The icon opens a search field in the header (desktop) or the sheet (phone). It shows **only once `/search` exists** (Q-023). Until then it's hidden, so it never leads to a 404. |

## Accessibility

Skip link "تخطَّ إلى المحتوى / Skip to content" first; `nav aria-label="الرئيسية / Main"`; all icon buttons labelled; the menu sheet traps focus and returns it to ☰; `scroll-padding-block-start: 88px` so focused headings aren't hidden under the header.

## Data

Nav labels from `messages/*.json` (`common.nav.*`). Social links, contact e-mail and footer rights from public `site_settings` (`social_x`, `social_instagram`, `contact_email`, `footer_rights_*`). The Instagram value is still the placeholder root URL, so it's hidden until it's a real account (see open questions).
