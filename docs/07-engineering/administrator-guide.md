# Administrator Guide / دليل المشرف

| Field            | Value                         |
| ---------------- | ----------------------------- |
| **Last Updated** | 2026-10-03                    |
| **Status**       | Ready for review by two admins |

Companion documents: [operations](../08-infrastructure/operations.md), [cutover runbook](../08-infrastructure/cutover-runbook.md),
[access inventory](access-inventory-template.md), [local demo guide](local-demo-guide.md).

## العربية

### المهام اليومية

| المهمة | أين | ملاحظات |
| ------ | ---- | ------- |
| مراجعة طلبات الانضمام | لوحة التحكم ← الدورات ← طلبات التقديم | القبول ينشئ الحساب ويرسل رابط التفعيل بالبريد؛ يظهر الإرسال في سجل البريد |
| إضافة عضو مباشرة | لوحة التحكم ← الأعضاء ← إضافة عضو | للقادة والمؤسسين والمشرفين؛ يصل العضو رابط تفعيل |
| الدورات (فترات الاستقبال) | لوحة التحكم ← الدورات | افتح الدورة ليتقدّم الناس من صفحة «انضم إلينا» دون حساب |
| الفعاليات | لوحة التحكم ← الفعاليات | معالج من أربع خطوات؛ تبويبات التسجيلات والحضور والشهادات |
| الحضور | تبويب الحضور في الفعالية | رمز QR يتجدد كل ١٢٠ ثانية؛ يمكن للحضور التسجيل بالبريد من صفحة الفعالية |
| الشهادات | تبويب الشهادات بعد اعتماد كل الأيام | إصدار ثم إرسال؛ الضيف يحمّلها من رابط البريد دون حساب |
| الإعدادات والشركاء | لوحة التحكم ← الإدارة | تُحدَّث الصفحة العامة خلال لحظات |
| سجل التدقيق وسجل البريد | لوحة التحكم ← الإدارة | السجل لا يُحذف؛ أعد إرسال الرسائل الفاشلة من سجل البريد |
| طلبات الخصوصية | لوحة التحكم ← الإدارة ← طلبات الخصوصية | «إكمال الحذف» يجهّل بيانات الشخص ويحذف حسابه ولا يمكن التراجع عنه |

### عند حدوث مشكلة

1. افتح `/api/health` على الموقع؛ إن لم يردّ «ok» فراجع Vercel وSupabase.
2. إن لم تصل رسائل البريد فراجع سجل البريد ثم إعدادات المزوّد (SPF وDKIM).
3. للاسترجاع من نسخة احتياطية اتبع [دليل التحويل](../08-infrastructure/cutover-runbook.md) قسم التراجع، ولا تحذف الحالة المعطوبة قبل نسخها.
4. أي تغيير في الصلاحيات يتم من لوحة التحكم فقط، والصلاحيات تُقرأ من قاعدة البيانات ولا توجد قوائم ثابتة.

## English

### Daily tasks

| Task | Where | Notes |
| ---- | ----- | ----- |
| Review membership applications | Dashboard → Cycles → applications | Accepting creates the account and e-mails an activation link; the send shows in the e-mail log |
| Add a member directly | Dashboard → Members → Add member | Leaders, founders and admins; the member gets an activation link |
| Cycles (intake windows) | Dashboard → Cycles | Open a cycle so people can apply from "Join us" without an account |
| Events | Dashboard → Events | Four-step wizard; Registrations, Attendance and Certificates tabs |
| Attendance | Attendance tab of the event | The QR code rotates every 120 s; attendees can also check in with their registered e-mail on the event page |
| Certificates | Certificates tab once every day is finalized | Issue, then send; guests download from the e-mailed link without an account |
| Settings and partners | Dashboard → Admin | The public page refreshes within moments |
| Audit and e-mail logs | Dashboard → Admin | The audit log is append-only; retry failed e-mails from the e-mail log |
| Privacy requests | Dashboard → Admin → Privacy requests | "Complete deletion" anonymizes the person's data and removes their account; it cannot be undone |

### When something goes wrong

1. Open `/api/health` on the site; if it does not answer `ok`, check Vercel and Supabase.
2. If e-mails do not arrive, read the e-mail log, then the provider settings (SPF, DKIM).
3. To restore from a backup follow the Rollback section of the [cutover runbook](../08-infrastructure/cutover-runbook.md); never delete the broken state before copying it.
4. Permission changes are made only in the dashboard; permissions are read from the database and there are no hardcoded lists.
