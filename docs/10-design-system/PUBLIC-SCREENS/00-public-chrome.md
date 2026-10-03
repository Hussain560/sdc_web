# Public Chrome — Header, Footer, Search, Toggles

Rendered on every public page by `src/components/Header` and `src/components/Footer`. The auth pages render the header and footer too, with a "back to home" link above the card.

---

## 1. Blueprint

### Desktop (1440px, RTL) — signed out

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  [ 👤 تسجيل الدخول ]  English 🌐   البحث 🔍   ☀              الأعضاء   الفعاليات   عن المجتمع   [شعار SDC] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
   ↑ sdc-actions (inline-end)                                    ↑ sdc-nav          ↑ sdc-logo (inline-start)
   height 68px · container 1280px · bottom border 1px translucent
```

### Desktop — signed in (CURRENT)

```
│  [ ⎋ تسجيل الخروج ]  👤 «الاسم أو البريد»  English 🌐  البحث 🔍  ☀     (لوحة اللجنة)  الأعضاء  الفعاليات  عن المجتمع  [شعار] │
```
- *لوحة اللجنة* appears only for e-mails in the hardcoded `COMMITTEE_EMAILS` list (removed in Phase 2).
- The name is plain text, not a menu.

### Mobile (375px)

```
┌─────────────────────────────────────┐
│ الأعضاء  الفعاليات  عن المجتمع   [شعار] │  row 1 (nav + logo)
│ (👤)   English 🌐   البحث 🔍   ☀       │  row 2 (actions; login collapses to an icon)
└─────────────────────────────────────┘
  height 92px · no hamburger menu
```

### Search overlay

```
┌──────────────────────────────────────────────┐   dimmed backdrop (click closes)
│  🔍 [ ابحث عن فعالية، ثريد، عضو…          ] ✕  │   centered modal, autofocus
└──────────────────────────────────────────────┘
```
Submitting navigates to `/search?query=…`, **which does not exist** (404). Pages that pass `onSearch` (members) filter in place instead.

### Footer

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                          تابعنا على        │
│                                                                    [𝕏] [in] [◎]          │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ [ شعار التذييل 215×95 ]                         جميع الحقوق محفوظة للمجتمع السعودي © 2026 │
│                                         تم تطويره وصيانته بواسطة [المجتمع السعودي للمطورين] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules (CURRENT — keep)

- **Header:** the logo is at the inline start (right in RTL). The nav links (عن المجتمع، الفعاليات، الأعضاء) come next; the active link uses `.active-link` (accent). The action group sits at the inline end. It is **not sticky**.
- **Theme toggle:** a sun/moon icon button. It swaps the logo asset (`Full whiteLogo 1.png` in dark ↔ `navbar.png` in light).
- **Language toggle:** shows the *other* language's name ("English" / "العربية").
- **Footer:** follow label + 3 social icons (38px squares, radius 8) on top; a divider; logo + copyright below.
- **Mobile:** two rows; the login button collapses to a 44px icon capsule.

## 3. States

| State | CURRENT | TARGET (same look) |
| ----- | ------- | ------------------ |
| Signed in | Name text + logout button | The name becomes an **account menu** (حسابي، لوحة التحكم if the user has any dashboard permission, تسجيل الخروج) in the same capsule style ([11-account-area](../INTERNAL-SCREENS/11-account-area.md)) |
| Committee link | Hardcoded e-mail list | Removed; *لوحة التحكم* in the account menu, driven by permissions (Phase 2) |
| Language | Client-side toggle; the page flashes LTR → RTL on load | `/[locale]` routing with server-rendered `lang`/`dir` (ADR-010) — same button and position |
| Search | Opens the overlay; submit goes to a missing `/search` | `/search` results page ([12-new-public-pages §5](./12-new-public-pages.md#5-search-results-search)) or the button is hidden until it exists |
| Focus | No visible focus ring | Accent focus ring on every control |

## 4. Data

| Item | CURRENT | TARGET |
| ---- | ------- | ------ |
| Nav labels | `LanguageContext` dictionary | next-intl messages (`common.nav.*`) |
| Social links | Hardcoded in `Footer.tsx` | `site_settings.social_links` ([platform entities](../../05-database/entities/platform.md)) |
| Copyright year | `new Date().getFullYear()` | Same |
| User | Supabase client session | SSR session (`@supabase/ssr`) + `AccessContext` |

## 5. Known issues (do not fix ad hoc)

- No skip link; icon buttons lack `aria-label` (the theme toggle has no text).
- The logo `alt="Logo"` is not localized.
- The footer text contains literal brackets: "[المجتمع السعودي للمطورين]".
- There is no mobile menu; the nav will wrap if more links are added.
