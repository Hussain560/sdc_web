# Manual QA and Release Regression Checklist

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Run on **staging** before every release. Copy into the release record and tick.

## 1. Matrix

Every core page is checked in: **Arabic RTL** × **English LTR** × **Dark** × **Light**, on desktop (≥ 1280 px) and mobile (≈ 375 px).

Core pages: home, about, events list, event detail (each phase), articles list/detail, members (leadership + directory), member profile, join (closed/open), login/register/reset, account, dashboard home, one page per dashboard module.

## 2. Checklist

### Content and i18n
- [ ] No untranslated keys or mixed-language strings on any page
- [ ] Dates show correct day/month in Asia/Riyadh; "to be announced" for TBA events
- [ ] Direction-sensitive icons (arrows, chevrons, breadcrumbs) point the right way
- [ ] Page titles and social previews localized

### Layout and design
- [ ] No horizontal scroll on mobile
- [ ] Theme toggle has no flash on reload; logo variant matches theme
- [ ] Badges/status chips have text, not only color
- [ ] Empty, loading and error states render (simulate empty lists and failures)

### Accessibility
- [ ] Keyboard-only: reach and operate every control; focus visible
- [ ] Dialogs: focus moves in, Escape closes, focus returns to trigger
- [ ] Screen reader spot check (NVDA/VoiceOver) on event registration and join form
- [ ] Form errors announced and associated with fields

### Roles and security
- [ ] Anonymous: `/dashboard` and `/account` redirect to login
- [ ] Plain user: no dashboard navigation; direct URL → access denied
- [ ] Committee head A: cannot see committee B's drafts or registrations (try direct URLs)
- [ ] Founder/advisor: reports visible, no approve/decide buttons
- [ ] Emails: correct language, escaped content, links point to the right environment

### Flows (spot-check the ones touched by the release)
- [ ] Register / cancel registration
- [ ] Review registrations (accept/reject/waitlist), email log shows result
- [ ] Membership cycle open → apply → decide → member visible (if opted in)
- [ ] Event draft → submit → approve → public → cancel (notifications)
- [ ] Article draft → publish → archive

### Release mechanics
- [ ] Migrations applied cleanly to staging
- [ ] Release notes (ar/en) reviewed
- [ ] Rollback plan in the release record
