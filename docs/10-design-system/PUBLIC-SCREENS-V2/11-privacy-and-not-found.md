# 11 — Privacy `/privacy` and Not Found (404)

## 1. Privacy notice `/privacy`

**Purpose.** A readable notice that people actually finish: what we collect, why, how long, and their rights.

```text
 الرئيسية › الخصوصية
 سياسة الخصوصية                                       t-h1
 آخر تحديث ‹date› · النسخة ‹version›                    caption
 ┌ on this page (sticky, ≥ lg, inline-end) ┐  ┌ reading column 68ch ──────────────────────┐
 │ ما نجمعه                                  │  │ ## ما نجمعه                                 │
 │ لماذا                                     │  │ …                                          │
 │ مدة الاحتفاظ                              │  │ (summary table: data · purpose · retention) │
 │ حقوقك                                     │  │ ## حقوقك                                    │
 │ تواصل معنا                                │  │ ( نزّل بياناتي ) ( اطلب حذف بياناتي )        │  ← signed-in members
 └───────────────────────────────────────────┘  └────────────────────────────────────────────┘
```

- Rendered from the existing Markdown source. While Q-031 is open, an info Alert stays at the top: "هذه النسخة بانتظار المراجعة القانونية. / This version is awaiting legal review." **The legal wording is the owner's** (hard rule 10).
- Data-subject actions appear for signed-in members only (the existing `data_requests` flow). Visitors get the contact e-mail.

## 2. Not found (404)

**Purpose.** Admit it plainly and get people back on track. It's the same page for unknown, unpublished and hidden things, so it never reveals what exists.

```text
╭─ header ─╮
                 [capsule-pair motif + a large "404" in t-display, --signal]   aria-hidden
                 لم نجد هذه الصفحة                                    t-h1
                 ربما نُقلت أو لم تعد متاحة.                             t-lede
                 ( العودة إلى الرئيسية )   تصفّح الفعاليات ←
                 [🔍 ابحث في الموقع ]          (only once /search exists)
╭─ footer ─╮
```

- Arabic and English from the catalogue (the current page is Arabic-only).
- HTTP status 404; `noindex`.
- No scattered PNG icons (the legacy 404 used 12); the motif is CSS and SVG.

## Media

None.
