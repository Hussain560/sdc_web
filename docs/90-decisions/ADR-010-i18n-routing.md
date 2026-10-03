# ADR-010 — Locale in the URL with next-intl

| Field | Value |
| ----- | ----- |
| **Status** | Accepted (implemented 2026-10-02, Sprint 02) |
| **Date** | 2026-10-02 |
| **Related** | NFR-I18N-001…006, [frontend architecture §3](../04-architecture/frontend-architecture.md#3-internationalization), [RTL rules](../10-design-system/foundations/rtl-and-i18n.md) |

## Context
Language is a client-side toggle stored in `localStorage`; the server always renders Arabic RTL, causing a direction flash for English users and preventing language-specific SEO/OG. Most strings are inline ternaries.

## Decision
- Locale is part of the URL via an `app/[locale]` segment, using **next-intl**. Arabic is the default locale **without prefix** (`/events`), English under `/en` (`/en/events`) — `localePrefix: 'as-needed'`.
- The `[locale]` layout renders `lang`/`dir` on the server.
- The language toggle navigates to the same path in the other locale and stores the preference in a cookie for the root redirect.
- Messages in `messages/{ar,en}.json`; content in bilingual DB columns.
- `hreflang` alternates in metadata.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Cookie-only locale (no URL change) | Server can render correctly, but pages are not cacheable per language and links/SEO are ambiguous |
| Prefix for both (`/ar`, `/en`) | Changes all existing Arabic URLs; no benefit over as-needed |
| Keep client toggle | Root cause of the flash; no SEO |

## Consequences
- Existing Arabic URLs keep working; English gets distinct URLs.
- All internal links use the locale-aware `Link` from next-intl.
