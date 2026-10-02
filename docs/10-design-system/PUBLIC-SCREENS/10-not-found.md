# Not Found — 404

`app/not-found.tsx` → `src/components/NotFound`. Rendered inside the normal header and footer.

---

## 1. Blueprint

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                     ⊘        ◎          ⊘                                                  │
│                ◎          4 0 4          ◎        ← large outlined numerals with a green   │
│                     ⊘                    ⊘          glow; small floating icons around them  │
│                           حدث خطأ                                                          │
│              عذراً، لم نستطع إيجاد الصفحة التي تبحث عنها                                    │
│                       [ الرجوع للرئيسية ]           ← primary capsule                       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Layout rules (CURRENT — keep)

Everything is centered. The floating icons are decorative `img` elements (`alert-02.png`, `cancel-circle.png`…).

## 3. States

| Case | TARGET |
| ---- | ------ |
| Unknown route | This page (HTTP 404) |
| Unknown or unpublished event/article slug | This page via `notFound()` (today these fall back to a default item) |
| Hidden member | This page |
| Server error | A separate `error.tsx` in the same style: title "حدث خطأ غير متوقع", *إعادة المحاولة* + *الرجوع للرئيسية* |

## 4. Known issues

- The title says "حدث خطأ" (an error occurred) for a missing page. A TARGET copy change to "الصفحة غير موجودة" needs approval.
- The decorative icons need `alt=""`.
