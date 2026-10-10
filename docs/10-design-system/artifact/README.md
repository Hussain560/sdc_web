Use this system for every public page of the Saudi Developer Community (SDC): Arabic first, dark first, a light theme that is just as complete, one green signal. The full written spec lives in the repository under `docs/10-design-system/` (v2, ADR-014); these rules are what a page needs.

## Content fundamentals

- **Arabic is the reference.** Write Modern Standard Arabic: warm, plain and gender-neutral ("يرجى المحاولة مرة أخرى", not a gendered imperative). English is its translation, in sentence case.
- **Plain verbs on actions:** "سجّل الآن / Register now", "قدّم طلب العضوية / Apply for membership", "تحقّق / Verify". One idea per sentence; say what happens next.
- **No eyebrow labels** above headings, no all-caps, no emoji in the UI, no exclamation marks in system messages.
- **Honest content only.** No invented figures, names, testimonials, partners or dates. Use clearly labelled placeholders ("(عنصر نائب)" / "PLACEHOLDER") and hide a section that has no real data.
- **Approved tagline:** "نبني مجتمعاً سعودياً يقود المستقبل بالذكاء الاصطناعي والتقنيات الحديثة." / "We build a Saudi community that leads the future with AI and modern technologies."
- **Name:** المجتمع السعودي للمطورين / Saudi Developer Community (SDC). Never "Saudi Developers Community".
- **Numbers and dates:** Western digits in both languages; Gregorian dates, Riyadh time: `14 أكتوبر 2026 · 6:00 – 8:00 م` / `14 October 2026 · 6:00 – 8:00 PM`.

## Colour

- Set the page on `canvas`. Put content on `surface` cards; nest with `surface-raised`; alternate full-width sections with `band`. Dialogs and sheets use `surface-overlay`; inputs use `field`.
- Body text is `text`; ledes, meta and helper text are `text-muted`. `text-subtle` is for placeholders and disabled text only.
- `accent` fills the **one** primary action per view, with `text-on-accent` for its label; hover is `accent-hover`. Links and accent icons use `accent-text`. Never fill a large area with `accent` and never set a paragraph in it.
- `signal` is decorative: the signal dots, stat numerals of 24px or more, glows. Never body text.
- Tinted fills pair with their own text: `accent-soft` + `on-accent-soft`, `success-soft` + `success`, `warning-soft` + `warning`, `danger-soft` + `danger`, `info-soft` + `info`. Never put `text-muted` on a soft fill.
- `brand` + `on-brand` is the deep-green secondary fill (rare). `danger-fill` + `on-danger-fill` is the destructive button.
- Decorative lines use `border`; any control boundary (input, checkbox, outline button) uses `border-strong` (3:1). Selected or framed surfaces use `border-accent`.
- Focus is always `focus-ring`: 2px solid, 2px offset, on `:focus-visible`.
- Status is always word + icon + colour (see StatusPill). Every pair above passes WCAG AA in both themes.
- Text never sits on a photo. Titles go below images, or on a solid `surface` strip.

## Type

- One family stack for everything: `--font-sans` ("Rubik", "IBM Plex Sans Arabic"). Arabic letters fall through to Plex Sans Arabic; Latin words and digits render in Rubik. Do not add a third family.
- Headings are weight 700 in both scripts (Plex Sans Arabic stops at 700). Emphasis is 600; there are no italics.
- Scale: `t-display` (home hero only, max 18ch) → `t-h1` page title → `t-h2` section title → `t-h3` → `t-h4` card title → `t-lede` (max 60ch, muted) → `t-body` (max 70ch) → `t-body-sm` → `t-label` → `t-caption` → `t-badge` (the minimum, 12px). Display, h1, h2, h3, stat and lede are fluid; the listed sizes are their 1440px values, and each style's usage note gives its `clamp()`.
- Arabic line heights run taller than English (body 1.8 vs 1.65). Never letter-space anything (it breaks Arabic joining). Use `tabular-nums` for stats, dates and counters.

## Space, shape and elevation

- 4px base: `space-2` inline gaps, `space-4` phone gutter, `space-6` card padding and grid gap, `space-8` from section header to content. Sections are separated by the fluid section gap (64px phones → 120px desktop), not by lines.
- Radius: every button, pill, chip and avatar is `radius-full`; inputs `radius-md`; accordion items and the image inside a card `radius-lg`; cards, dialogs and the header `radius-xl`; bands and the auth brand panel `radius-2xl`. Inner radius = outer radius − padding.
- Separate by tone first, hairline second, shadow last. Cards rest with no shadow; hover adds `elev-1` and a 2px lift. `elev-2` is for dialogs, sheets, menus and the scrolled header; `elev-3` for toasts.
- Containers: `container` 1280 (pages), `container-wide` 1440 (bands, header), `container-narrow` 768 (forms), `container-reading` 720 (articles), `container-tight` 440 (auth). The event side panel is `side-panel` 360 from 1024px.
- Content never scrolls sideways at any width from 320px. Long names, e-mails and URLs wrap; tables scroll inside their own box.

## Motif

SDC's own graphic language comes from its mark: two crossing capsules and two dots. Use the **signal dots** (two 8px `signal` dots) before section titles, the **capsule pair** behind hero art and on empty states, and the **dot grid** (2px dots on a 24px pitch in `border`) as quiet texture. At most one motif per section, never under text, always `aria-hidden`. Do not use any other site's motifs.

## Logos and art

- Use the files in the Logos group exactly: `sdc-wordmark-on-dark.png` on dark surfaces, `sdc-wordmark-on-light.png` on light ones (it has a baked mint background: place it on `canvas` or `band`, or blend with `mix-blend-mode: multiply`). Swap them with the `theme-dark-only` / `theme-light-only` classes. Never redraw, recolour, outline or put a logo on a photo.
- Clear space = one mark-dot height on every side. Minimum height: 28px wordmark, 24px mark.
- Hero art: `hero-mark-dark.png` / `hero-mark-light.png`, decorative (`alt=""`).

## Iconography

lucide only, stroke 1.75, `currentColor`. 20px default (16 in badges and meta rows, 24 in the nav and alerts, 40 in result dialogs). Benefit icons sit in a 48px `accent-soft` tile. Mirror directional icons in RTL (arrows, chevrons); never mirror search, calendar, clock, pin, check or X. An icon on its own needs an `aria-label`; next to text it is `aria-hidden`. One icon per concept: event = calendar-days, time = clock, place = map-pin, online = video, seats = users, certificate = award, check-in = qr-code.

## Direction and language

- Design RTL first; the same markup mirrors to LTR. Use logical properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`).
- Numbers, dates, e-mails, URLs, codes and handles keep their own direction: `<bdi>` inline, `dir="ltr"` on inputs and code.
- Every component must survive English that is 30% longer than the Arabic. Only card titles clamp (2 lines); actions never truncate.
- The language switch shows the target language in its own name ("English" / "العربية") and keeps the path.

## Motion

Quick and soft (160–240ms, `cubic-bezier(0.2, 0, 0, 1)`); animate transform, opacity and colours only. Sections fade up 12px once on reveal; stats count up once; cards lift on hover. Under `prefers-reduced-motion` all of that is off. The registration progress keeps its 1.5s minimum, shown as static text.

## Components

Build pages from the component cards: Button, IconButton, TextLink, SegmentedToggle, Badge, StatusPill, TagChip, DateChip, EventCard, ArticleCard, MemberCard, FeatureCard, StatsRow, Avatar, MediaFallback, QrCard, CertificateCard, Field, PasswordField, Select, Textarea, Checkbox, Radio, Switch, Dialog, ResultDialog, BottomSheet, Toast, Alert, NavBar, Footer, Breadcrumb, Tabs, Accordion, Pagination, Stepper, EmptyState, Skeleton. Patterns: SectionHeader, Hero, FilterBar, CtaBand, AuthLayout. Each card's README says what the consumer supplies. Load `components/bundle.css` after the tokens; class names are prefixed `ds-` and type styles `t-`.

## Flows that must behave exactly so

- **Registration:** a single button opens the dialog → on submit the button and dialog switch to sending (form locked, close disabled, progress bar) for **at least 1.5s** whatever the server does → the same dialog becomes a ResultDialog: one icon, a title that says what happened, one sentence, one action. Registered, pending review, waiting list, already registered, full, closed, too many attempts, members-only and try again each have their own result.
- **Auth pages** (sign in, forgot/reset password, profile claim) have **no site header or footer**: the form column plus a decorative brand panel. There is no "create account": the path is "Apply for membership" → `/join`.
- **Directory:** show only listed members and only the fields each member made public; never contact details.

## Accessibility

WCAG 2.2 AA in both themes and both directions: visible focus everywhere, 44px touch targets, labelled fields with linked hints and errors, dialogs that trap and return focus, live regions for results and counts, one `h1` per page, a skip link, and no horizontal scroll at 320px.
