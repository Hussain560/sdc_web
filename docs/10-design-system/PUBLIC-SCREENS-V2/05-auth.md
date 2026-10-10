# 05 — Auth Pages: `/login`, `/forgot-password`, `/reset-password`, `/claim/[token]`

**Purpose.** A quiet, focused place for **members and staff** to sign in or recover access. There is **no public sign-up** (ADR-013): everyone else is pointed to the membership application.

## 1. Layout (own route layout, no site header, no footer)

A route group `app/[locale]/(auth)/layout.tsx` wraps the four pages with the [auth split layout](../patterns.md#14-auth-split-layout). The public header and footer **do not render**.

```text
desktop ≥ 1024 (RTL)
┌──────────────────────────────────────────────┬───────────────────────────────────────────┐
│ English  ☀                                    │ ╭───────────────────────────────────────╮ │
│                                              │ │                                       │ │
│        [شعار SDC]  → /                       │ │      brand panel (--band, r=2xl)       │ │
│                                              │ │      SDC mark + capsule pair            │ │
│        مرحباً بعودتك                    t-h1   │ │      dot grid, aria-hidden              │ │
│        سجّل الدخول بحساب العضوية.         lede   │ │                                       │ │
│                                              │ │      (optional owner photo, M-40)       │ │
│        البريد الإلكتروني                       │ │                                       │ │
│        [ name@example.com            ]       │ │                                       │ │
│        كلمة المرور                            │ │                                       │ │
│        [ ••••••••                 👁 ]       │ │                                       │ │
│        ☐ تذكرني           نسيت كلمة المرور؟    │ │                                       │ │
│        [            دخول            ]        │ │                                       │ │
│                                              │ │                                       │ │
│        لست عضواً بعد؟ قدّم طلب العضوية ←       │ │                                       │ │
│        ← العودة إلى الرئيسية                   │ ╰───────────────────────────────────────╯ │
└──────────────────────────────────────────────┴───────────────────────────────────────────┘
  form column: max 440, centred in its half          panel: 45%, 16px inset from the viewport

phone < 1024
┌────────────────────────────────┐
│▓▓ brand strip 96px: mark ▓▓▓▓▓│  --band, bottom radius --radius-2xl
│ English ☀                       │
│ مرحباً بعودتك                    │
│ fields …                        │
│ [          دخول          ]      │
│ لست عضواً بعد؟ قدّم طلب العضوية   │
│ ← العودة إلى الرئيسية             │
└────────────────────────────────┘
```

## 2. The "apply for membership" path (instead of "create account")

Below the primary action, centred: "لست عضواً بعد؟ **قدّم طلب العضوية** ← / Not a member yet? **Apply for membership** →", a [standalone link](../components.md#13-link) to `/join`. When the intake is closed, the link stays (the join page explains the next window). `/register` keeps redirecting to `/join`.

## 3. Pages and their states

### 3.1 Sign in `/login`

| Field | Rules |
| ----- | ----- |
| البريد الإلكتروني / E-mail | `type=email`, `autocomplete="username"`, `dir="ltr"` |
| كلمة المرور / Password | `autocomplete="current-password"`, the show/hide toggle, paste allowed |
| تذكرني / Remember me | Checkbox; on = a persistent session, off = a session cookie |
| دخول / Sign in | Primary, lg, full width |

| State | UI |
| ----- | -- |
| Submitting | The button loads; the fields are read-only |
| Wrong e-mail or password | Alert (danger) above the form: "البريد أو كلمة المرور غير صحيحة. / The e-mail or password is incorrect." (never says which) |
| E-mail not confirmed | Alert (info) + "أعد إرسال رابط التفعيل / Resend the activation link" |
| Too many attempts | Alert (warning) "محاولات كثيرة، انتظر ‹n› ثانية. / Too many attempts. Wait ‹n› seconds." + countdown |
| Session expired | Alert (info) "انتهت جلستك، سجّل الدخول من جديد. / Your session ended. Please sign in again." |
| Redirect | `?redirect=` is kept (same-origin paths only) |
| Signed in already | Redirect to `?redirect` or `/account` |

### 3.2 Forgot password `/forgot-password`

Title "نسيت كلمة المرور؟ / Forgot your password?", lede "أدخل بريدك وسنرسل لك رابطاً لتعيين كلمة جديدة. / Enter your e-mail and we'll send you a link to set a new one." One field, the primary "أرسل الرابط / Send the link", the link "العودة لتسجيل الدخول / Back to sign in".

| State | UI |
| ----- | -- |
| Sent (always, even for unknown e-mails) | The form is replaced by a result block: `Mail` icon (info), "تفقّد بريدك / Check your inbox", "إن كان البريد مسجّلاً فسيصلك الرابط خلال دقائق. / If the e-mail has an account, the link arrives within minutes.", and "أعد الإرسال / Resend" (enabled after 60 s, with a countdown) |
| Too many requests | Alert (warning) + countdown |

### 3.3 Reset password `/reset-password` (also: first password after an accepted application)

Title "تعيين كلمة مرور جديدة / Set a new password" (activation: "اختر كلمة مرور لحسابك / Choose a password for your account"). Fields: new password (with toggle and a live checklist: ≥ 8 characters, not the e-mail) and confirm.

| State | UI |
| ----- | -- |
| Invalid or expired link | Result block (warning) "انتهت صلاحية الرابط / This link has expired" + "اطلب رابطاً جديداً / Request a new link" → `/forgot-password` |
| Mismatch / weak | Field errors |
| Success | Result block (success) "تم تعيين كلمة المرور / Your password is set" + "دخول / Sign in" (or straight to `/account` when the session is already active) |

### 3.4 Claim profile `/claim/[token]`

For legacy members linking their old record. Signed-out visitors go to `/login?redirect=/claim/…` first. Signed in: a card with the preview (the name and member details being claimed, from `previewClaim`), the primary "اربط هذا الملف بحسابي / Link this profile to my account", and the ghost "ليس ملفي / This isn't me".

| State | UI |
| ----- | -- |
| Valid | Preview + actions |
| E-mail mismatch | Alert (warning) "هذا الرابط مُرسل إلى بريد آخر. سجّل الدخول به. / This link was sent to another e-mail. Sign in with that one." |
| Expired / used | Result block (neutral) + a contact link |
| Done | Result block (success) "تم ربط ملفك / Your profile is linked" + "اذهب إلى ملفي / Go to my profile" |

## 4. Accessibility and security notes

- One `h1` per page; the result blocks move focus to their title.
- Errors are specific but never reveal whether an account exists.
- The brand panel is decorative (`aria-hidden`) and holds no text the reader needs.
- `autocomplete` tokens everywhere; no CAPTCHA puzzles (A-15).

## 5. Media

`M-40` optional brand-panel photograph (owner supplied; the motif panel ships until then), `M-41` the SDC mark (exists).
