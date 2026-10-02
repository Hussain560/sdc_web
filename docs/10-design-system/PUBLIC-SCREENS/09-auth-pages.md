# Auth Pages — `/login`, `/register`, `/forgot-password`, `/reset-password`

All four share `app/login/login.css`: a centered card (420px wide) between the header and the footer, with a "← العودة للصفحة الرئيسية" link above the card at the inline start.

> **Account ≠ membership (D-001).** `/register` creates an **account** only. Joining the community happens on [`/join`](../INTERNAL-SCREENS/25-join-page.md) during an open intake window.

---

## 1. Blueprints

### Login

```
               ← العودة للصفحة الرئيسية
        ┌──────────────────────────────────────┐
        │            تسجيل الدخول               │  h1 36px
        │ مرحباً بعودتك! أدخل بياناتك للوصول…    │
        │ البريد الإلكتروني                      │
        │ [ example@domain.com              ]  │  inputs 49px, radius 12
        │ كلمة المرور                            │
        │ [ ••••••••                        ]  │
        │                    نسيت كلمة المرور؟   │  link, accent
        │ [          تسجيل الدخول           ]  │  primary capsule 47px
        │        مستخدم جديد؟ إنشاء حساب جديد     │
        └──────────────────────────────────────┘  card 420×532, radius 20
```

### Register

```
        ┌──────────────────────────────────────┐
        │            إنشاء حساب جديد            │
        │     انضم إلى المجتمع السعودي للمطورين.  │  ← TARGET copy: "أنشئ حسابك…" (D-001)
        │ الاسم الثلاثي        [              ] │
        │ البريد الإلكتروني     [              ] │
        │ كلمة المرور          [              ] │
        │ يجب أن تحتوي على 8 أحرف على الأقل…     │  hint, muted 13px
        │ تأكيد كلمة المرور     [              ] │
        │ [            إنشاء حساب           ]  │
        │      لديك حساب مسبقًا؟ تسجيل الدخول     │
        └──────────────────────────────────────┘
```

### Forgot password

```
        │          استرجاع كلمة المرور           │
        │ يرجى إدخال البريد الإلكتروني المرتبط…  │
        │ البريد الإلكتروني [                  ] │
        │ [        إرسال رابط الاسترجاع        ] │
        │           الرجوع لتسجيل الدخول          │
```

### Reset password

```
        │         تعيين كلمة مرور جديدة          │
        │ يرجى إدخال كلمة المرور الجديدة أدناه…  │
        │ «جاري التحقق من صلاحية الرابط...»       │  ← state while the recovery session is verified
        │ كلمة المرور الجديدة        [          ] │
        │ تأكيد كلمة المرور الجديدة   [          ] │
        │ [        تحديث كلمة المرور          ]  │  ← "جاري التحديث..." while pending
        │ «تم تحديث كلمة المرور بنجاح» → login   │
```

---

## 2. Layout rules (CURRENT — keep)

- The card is centered horizontally, 128px from the header; inputs are full width inside the card.
- Error and success messages appear above the submit button as inline text (red / green).
- Submit buttons show a loading label while pending (e.g., "جاري…").

## 3. States

| Page | CURRENT | TARGET (same look) |
| ---- | ------- | ------------------ |
| Login | Error text from Supabase (English for some errors) | Localized errors; `?redirect=` honoured only for same-site paths; a signed-in visitor is redirected away |
| Register | Client checks (name, password policy, match); `check-email-exists` Edge Function **reveals whether an e-mail exists** | Server action with Zod; no e-mail-existence oracle; success shows "تحقق من بريدك" in the same card |
| Register copy | "انضم إلى المجتمع…" implies membership | "أنشئ حسابك في منصة المجتمع" + a muted line "العضوية عبر صفحة الانضمام عند فتح باب التسجيل" linking to `/join` |
| Forgot | Sends the reset e-mail | Always shows the same success message (no enumeration) |
| Reset | Verifying → form → success → redirect to login | Same; an expired link shows an error state with *طلب رابط جديد* |
| Loading | Button label | Same |

## 4. Data

Supabase Auth via `@supabase/ssr` (Phase 2); profile row created by a trigger ([authentication](../../06-security/authentication.md), [authentication module](../../11-modules/authentication/README.md)).

## 5. Known issues

- The e-mail-existence check is public (the `check-email-exists` Edge Function with `verify_jwt=false`).
- Password fields have no show/hide toggle.
- Labels are not programmatically associated with inputs on every page ([accessibility](../accessibility.md)).
