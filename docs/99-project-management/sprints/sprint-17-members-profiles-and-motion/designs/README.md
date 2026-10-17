# Sprint 17 designs

Exported from Claude Design on 2026-10-17 and approved by the owner. The PNGs are the visual source of truth. `صفحة الفعالية — SDC (3).html` is the full export: it is a bundle (a manifest of gzipped pages plus a template), and it uses design-canvas syntax, so it does not run as app code. The readable text, copy and the motion code of each page are in [text/](./text). Never paste exported HTML into the app: rebuild each screen with the repo's tokens and primitives.

| Screen | PNG | Text notes | Story |
| ------ | --- | ---------- | ----- |
| Directory, desktop | `دليل الأعضاء · 1440.png` | `text/directory.txt` | RDS-033 |
| Directory, phone | `دليل الأعضاء · الجوال.png` | `text/directory-phone.txt` | RDS-033 |
| Directory states (loading, empty, no results, error) | `دليل الأعضاء · الحالات.png` | `text/directory-states.txt` | RDS-033 |
| Profile, full | `ملف العضو · 1440 (مكتمل، AR EN).png` | `text/profile.txt` | RDS-034 |
| Profile, phone | `ملف العضو · الجوال.png` | `text/profile-phone.txt` | RDS-034 |
| Profile, name only | `ملف عضو بالاسم فقط.png` | `text/profile-sparse.txt` | RDS-034 |
| Home marquee, desktop and phone | `الرئيسية · شريط الأعضاء 1440.png`, `شريط الأعضاء · الجوال.png` | `text/home-marquee.txt`, `text/marquee-phone.txt` | RDS-035 |
| Profile editor, desktop and phone | `محرّر الملف account member-profile.png`, `المحرّر · الجوال.png` | `text/editor.txt`, `text/editor-phone.txt` | MEM-013 |
| Photo crop, consent, upload errors | `قص الصورة · الموافقة · أخطاء الرفع.png` | `text/photo-crop-and-consent.txt` | MEM-012 |
| Add-member wizard and results | `معالج إضافة عضو.png`, `نتائج المعالج.png` | `text/wizard.txt`, `text/wizard-results.txt` | MEM-014 |
| Dashboard list, detail, phone | `لوحة التحكم · قائمة الأعضاء.png`, `لوحة التحكم · تفاصيل العضو.png`, `لوحة التحكم · الجوال.png` | `text/dashboard-*.txt` | MEM-015 |
| Assign position and picker states | `نافذة تعيين منصب.png`, `حالات منتقي العضو.png` | `text/assign-dialog.txt`, `text/assign-states.txt` | ACC-007 |
| Motion language (16 patterns, tokens, CSS and `motion` code) | `لغة الحركة · المواصفة.png` | `text/motion-language.txt` | MOT-001, MOT-002 |
| About (older, for reference) | `من نحن · …` | — | already built |

## What the phone designs add

- Profile: stats strip (since, projects, articles, events), link chips under the header, "read more" on the about text, projects as a horizontal scroll, "similar skills" members at the end.
- Directory: skill chips scroll sideways, one filters button with a count that opens a bottom sheet, removable chips, cards are rows with the arrow at the start.
- Editor: a name language switch (Arabic / English) with a red dot on "English" when a field is missing, a sticky completeness bar, the skills picker as a bottom sheet, and a "preview as visitors see me" button that opens a sheet.
- Dashboard: cards instead of a table, a round add button, the wizard is full screen with a thin progress bar and a sticky Next/Cancel footer, the assign picker is a bottom sheet.
- Marquee: smaller, slower cards; touch stops the row at once, a drag moves it, and it resumes after 3 s. The two rows are shorter so the section fits one screen.
