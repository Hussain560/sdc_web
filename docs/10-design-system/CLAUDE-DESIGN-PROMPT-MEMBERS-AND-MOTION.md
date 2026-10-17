# Claude Design brief — Members and motion

You already know our Design System v2 (the Saudi Developer Community, SDC). Use it: same tokens, type, components, dark-first with a light theme, Arabic first and right-to-left, English under `/en`. You don't need to restate the system; build on it and push it further where these pages need it.

## The idea

Our members are the community. Today they appear as initials and a track name, and that undersells them. We want a visitor, a student or a recruiter to land on our site and feel that this is a community of real, skilled people. They should be able to get to know any member in a minute: who they are, what they work on, what they're good at, and how to reach their public work.

At the same time the site feels too still. We want a motion language that makes it feel alive and crafted, not busy.

## What to design

1. **Home: the members marquee.** A moving section of member cards, the moment on the landing page that says "look who's here". Cards must look great at every size, with and without a photo. Think about how it pauses, how it feels on a phone, and what it shows when motion is reduced.
2. **Members directory (`/members`).** A full redesign. Leadership, then the members: search, filtering by skill, committee and track, and cards that carry a headline and a few skills. Show the empty, loading and no-results states too.
3. **Member profile (`/members/[id]`).** Something close to a LinkedIn profile, in our own style. It needs a header with photo, name, headline, committee and role, and badges for what they're open to (internship, job, mentoring and so on). Below that come social and portfolio links, an about section, skills grouped by area (Web, AI and data, Security, Mobile, Design, Cloud…) and projects with links. Add their committees and positions, articles they wrote and, if they allow it, the events they took part in. Every block may be missing because the member chose not to show it, so the page must still look complete with only a name.
4. **Member profile editor (`/account/member-profile`).** Here members build that profile: upload and crop a photo, write their names (first, middle and last, in Arabic and English), headline, about, pick skills, add projects and links, and choose what's public. Include a profile-completeness nudge and a live preview of how visitors will see them. Make filling it in feel rewarding.
5. **Dashboard: add-member wizard.** This replaces today's single dialog with steps. Step one is identity (full names in Arabic and English, e-mail, phone). Then academic info. Then an optional committee and position. Then review. Show the success and failure results.
6. **Dashboard: members list and member detail.** A list that shows the complete picture (photo, full name, committee and position, status, profile completeness), plus a detail page with everything we hold about the member and their history.
7. **Assign-position dialog.** A user picker that clearly searches, finds, shows "no results", and works with the keyboard; then role, committee and dates. Today it feels broken.
8. **Motion language for the whole public site.** Page entrance, reveals as you scroll, list stagger, card hover, the marquee, number count-ups, and maybe transitions between pages. Show where each one is used on Home, the event page, members, articles, committees and Join. Give durations and easing in terms of our motion tokens, and the reduced-motion version of each.
   We will build it with CSS scroll-driven animation for simple reveals, the `motion` library (the successor to Framer Motion) for gestures, springs, drag, layout animation and exit animations, and React view transitions for moving between pages, so you can design things like a draggable marquee, springy sheets, cards re-flowing as filters change, and a member photo that travels from the card into the profile header.

## Things to respect

- Privacy first: a field appears publicly only if the member turned it on. Never show e-mail or phone on public pages.
- Arabic is the primary layout; mirror correctly for English. Names in Arabic can be long.
- Both themes, 360 px phones up to wide desktop, keyboard and screen-reader friendly, AA contrast.
- Motion uses transform and opacity, never shifts the layout, and has a calm reduced-motion version.
- The dashboard screens keep the dashboard's existing feel; the public pages may be more expressive.

## What we'd like back

For each screen: the layout at desktop and phone, the states, the components (new ones described with their variants), and short notes on behaviour. For motion: a small spec we can implement in CSS. Real-looking sample content in Arabic and English, with a mix of members who filled everything and members who filled almost nothing.

Surprise us. If you see a better way for visitors to discover members than what we listed, propose it.
