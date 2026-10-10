# 10 — Certificate Verification `/certificates/[id]`

**Purpose.** Anyone holding a certificate id or a QR from the PDF can confirm that the certificate is real, in one look, and print a clean copy. It has to look **official and trustworthy**: quiet, centred, no marketing.

## Wireframe (RTL)

```text
╭─ header (normal chrome) ─╮
                       التحقق من شهادة                                      t-h1, centred
             تحقّق من صحة شهادة صادرة من المجتمع السعودي للمطورين.             t-lede
 ┌──────────────────────────────────────────────────────────────────────────┐   --container-narrow
 │ [logo]                                          ( ✓ شهادة صحيحة )          │   certificate card
 │ شهادة حضور                                                                 │   (components §3.5)
 │ ‹participant name›                                          t-h3           │
 │ ‹event title›                                                              │
 │ 📅 ‹date(s)›   ✓ حضر ‹n› من ‹m› جلسات (‹p›%)                                 │
 │ ─────────────────────────────────────────────────────────────────────────  │
 │ 3f6c…-…-…a91 (full uuid, mono, ltr)      ( تنزيل PDF )  ( نسخ الرابط )  🖨  │
 └──────────────────────────────────────────────────────────────────────────┘
       صدرت في ‹issued_at›. التحقق مباشر من سجلات المجتمع.                       caption, muted
 ┌ verify another ───────────────────────────────────┐
 │ رقم الشهادة  [ xxxxxxxx-xxxx-…           ] ( تحقّق ) │                         dir=ltr input
 └───────────────────────────────────────────────────┘
```

## States

| State | Card |
| ----- | ---- |
| Valid | As above, success pill "شهادة صحيحة / Valid certificate" |
| Revoked | **Not supported by the data today** (certificates have no revoked state). If revocation is added (Q-CE1): warning pill "أُلغيت هذه الشهادة / This certificate was revoked", no download. |
| Not found / malformed id | `CircleX` danger block "لم نجد شهادة بهذا الرقم / No certificate matches this id" + "تأكّد من الرقم كما يظهر في أسفل الشهادة. / Check the id as printed at the bottom of the certificate." + the verify form (the page still returns HTTP 404 for an unknown id, so it isn't indexed) |
| Loading | Card skeleton |
| Print | `@media print`: white page, black text, logo, all facts, the id and the full verification URL, no chrome, no buttons |

Names, attendance and dates show exactly as the certificate snapshot froze them (`recipient_name`, `sessions_attended`, `sessions_expected`, `attendance_percent`, `issued_at`), never live profile data. The e-mail is **never** shown. The page is `noindex`.

## Data

`verify_certificate(p_id)` RPC (public client): the frozen facts. The PDF comes from the existing certificates PDF route.

## Media

The logo files (exist). The PDF template design is outside this brief (it exists in `modules/attendance/pdf`).
