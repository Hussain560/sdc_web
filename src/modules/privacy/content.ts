/** Version of the privacy notice. Stored with every consent (`consent_version`). Bump it when the text changes. */
export const PRIVACY_VERSION = '2027-03-draft';

/**
 * The notice (Markdown). It describes what the platform really does today. The legal wording, retention periods and
 * the controller's contact are pending the owner's answer (Q-031): the page says so openly.
 */
export const PRIVACY_TEXT = {
  ar: `## من نحن
المجتمع السعودي للمطورين («المجتمع») مجتمع غير ربحي. تصف هذه السياسة البيانات التي تجمعها هذه المنصة وكيف تُستخدم.

## البيانات التي نجمعها
- **التسجيل في فعالية:** الاسم والبريد الإلكتروني ورقم الجوال، والجامعة أو جهة العمل (اختياري).
- **طلب العضوية:** بيانات النموذج (الاسم، البريد، الجوال اختياريًا، الدراسة أو العمل، النبذة والروابط، إجابات الأسئلة) وتاريخ موافقتك على هذه السياسة.
- **الحضور والشهادات:** تسجيل حضورك في جلسات الفعالية، ونسبة الحضور، والشهادة الصادرة لك.
- **حساب العضو:** البريد والاسم وملف العضوية الذي تعدّله بنفسك، وسجلات الدخول لدى مزود المصادقة.
- لا نجمع بيانات تتبّع إعلانية ولا نبيع بياناتك.

## لماذا نستخدمها
لتنظيم الفعاليات وإرسال رسائل التأكيد والشهادات، ولمراجعة طلبات العضوية، ولإعداد إحصاءات مجمّعة لا تكشف الأفراد، ولحماية المنصة من إساءة الاستخدام.

## من يطّلع عليها
- أنت، عبر حسابك أو عبر الروابط المرسلة إليك.
- منظمو الفعالية والمراجعون في نطاق صلاحياتهم فقط.
- لا يظهر بريدك ولا جوالك للعموم أبدًا. ملف العضو لا يظهر في الدليل العام إلا إذا اخترت ذلك.
- مزودو الخدمة الذين يعالجون البيانات نيابةً عنا: Supabase (قاعدة البيانات والمصادقة)، Vercel (الاستضافة)، ومزوّد البريد الإلكتروني.

## مدة الاحتفاظ (مقترحة، بانتظار الاعتماد)
طلبات العضوية المرفوضة أو المسحوبة: سنتان ثم تُجهَّل. تسجيلات الفعاليات: ثلاث سنوات ثم تُجهَّل مع بقاء الأعداد. سجل الرسائل: سنة. سجل التدقيق: ثلاث سنوات.

## حقوقك
يحق لك الاطلاع على بياناتك وتصحيحها وطلب حذفها. يستطيع الأعضاء تنزيل بياناتهم وطلب حذف الحساب من صفحة «بياناتي» في حسابهم. ولغير الأعضاء يكفي مراسلتنا على البريد أدناه.

## التواصل
{{contact}}

> هذه النسخة مسودة تنتظر المراجعة القانونية (الإصدار {{version}}). قد تتغير الصياغة ومدد الاحتفاظ قبل الاعتماد النهائي.`,
  en: `## Who we are
The Saudi Developer Community (the "Community") is a non-profit. This notice describes the data this platform collects and how it is used.

## What we collect
- **Event registration:** name, e-mail address, phone number, and optionally your university or workplace.
- **Membership application:** the form data (name, e-mail, optional phone, study or work, bio and links, answers to the questions) and when you accepted this notice.
- **Attendance and certificates:** your check-ins to event sessions, your attendance percentage and the certificate issued to you.
- **Member account:** e-mail, name and the member profile you edit yourself, plus sign-in records kept by the authentication provider.
- We do not collect advertising trackers and we do not sell your data.

## Why we use it
To run events and send confirmations and certificates, to review membership applications, to produce aggregate statistics that do not identify people, and to protect the platform from abuse.

## Who can see it
- You, through your account or the links sent to you.
- Event organizers and reviewers, only within their permissions.
- Your e-mail and phone are never public. A member profile appears in the public directory only if you opt in.
- Service providers that process data for us: Supabase (database and authentication), Vercel (hosting) and the e-mail provider.

## How long we keep it (proposed, pending approval)
Rejected or withdrawn membership applications: two years, then anonymized. Event registrations: three years, then anonymized (counts are kept). E-mail log: one year. Audit log: three years.

## Your rights
You may access and correct your data and ask for it to be deleted. Members can download their data and request account deletion from *My data* in their account. Anyone else can simply write to the address below.

## Contact
{{contact}}

> This version is a draft awaiting legal review (version {{version}}). The wording and retention periods may change before final approval.`,
} as const;
