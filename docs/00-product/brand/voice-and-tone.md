# Voice and Tone

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Voice

SDC speaks as a **welcoming, professional peer community** — warm but not casual, confident but not promotional.

| Trait | Do | Avoid |
| ----- | -- | ----- |
| Welcoming | "أهلًا بك" / "We're glad to have you" | Cold system language ("Request processed") |
| Clear | One idea per sentence; say what happens next | Jargon in user-facing copy |
| Respectful | Formal Modern Standard Arabic in UI and email | Colloquial dialect in UI copy |
| Honest | State the real reason when known | Inventing reasons (see §4) |
| Inclusive | Gender-neutral or both forms where practical | Addressing all users in one gender |

## 2. Language rules

| Rule | Detail |
| ---- | ------ |
| Arabic is the reference copy | English is a translation of Arabic, complete for every screen. |
| Modern Standard Arabic | UI, emails and documents. Code comments may use any language but should be consistent per file. |
| Gender | **PROBLEM** — the current UI mixes forms (e.g., "حاولي مرة أخرى" feminine imperative in one error, masculine elsewhere). Prefer neutral constructions ("يرجى المحاولة مرة أخرى"). |
| Numbers and dates | Arabic UI: Gregorian dates with Arabic month names; Western digits are acceptable (**OPEN Q-042** — Hijri dates required?). English UI: `d MMMM yyyy`. Never store dates as display strings. |
| Terminology | Use the [glossary](../glossary.md); one term per concept. |

## 3. Approved phrases

| Context | Arabic | English |
| ------- | ------ | ------- |
| Sign-off (email) | فريق المجتمع السعودي للمطورين | The Saudi Developer Community team |
| Tagline | نبني مجتمعاً سعودياً يقود المستقبل بالذكاء الاصطناعي والتقنيات الحديثة. | We build a Saudi community that leads the future with AI and modern technologies. |
| Generic retry error | حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى. | Something went wrong. Please try again. |
| Registration received | تم استلام طلب تسجيلك وسيتم إشعارك بالنتيجة عبر البريد الإلكتروني. | We received your registration and will email you the outcome. |

## 4. Email tone

**CURRENT** — the rejection email states the reason is "limited seats and high demand" for every rejection.

**PROBLEM** — this asserts a reason that may not be true for a given rejection.

**TARGET** — rejection emails use a neutral, kind message without asserting a reason, unless the reviewer selects a reason (**OPEN Q-028**).

## 5. Microcopy patterns

| Situation | Pattern |
| --------- | ------- |
| Empty list | Say what is empty and what the user can do next. |
| Closed membership intake | State that applications are closed and, if known, when the next cycle is expected. |
| Ended event | "This event has ended" + link to upcoming events. |
| Permission denied | "You don't have access to this page" — never reveal what exists behind it. |
