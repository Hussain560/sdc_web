/**
 * Human wording for the audit log (ACC-005). The database stores stable codes (`member.renewed`, `role_assignment`,
 * `starts_at`); the page shows them in the reader's language. Unknown codes never show raw: they are humanised from
 * their parts, so a new action added later still reads as words until it gets its own label.
 */
type Localized = { ar: string; en: string };
type Lang = 'ar' | 'en';

export const ENTITY_LABEL: Record<string, Localized> = {
  member: { ar: 'عضو', en: 'Member' },
  role_assignment: { ar: 'منصب', en: 'Position' },
  membership_application: { ar: 'طلب عضوية', en: 'Membership application' },
  membership_cycle: { ar: 'دورة عضوية', en: 'Membership cycle' },
  committee: { ar: 'لجنة', en: 'Committee' },
  event: { ar: 'فعالية', en: 'Event' },
  article: { ar: 'مقال', en: 'Article' },
  registration: { ar: 'تسجيل', en: 'Registration' },
  attendance_session: { ar: 'جلسة حضور', en: 'Attendance session' },
  partner: { ar: 'شريك', en: 'Partner' },
  tag: { ar: 'وسم', en: 'Tag' },
  site_settings: { ar: 'إعدادات الموقع', en: 'Site settings' },
  profile: { ar: 'حساب', en: 'Account' },
  data_request: { ar: 'طلب بيانات', en: 'Data request' },
  system: { ar: 'النظام', en: 'System' },
  certificate: { ar: 'شهادة', en: 'Certificate' },
  role: { ar: 'دور', en: 'Role' },
  user: { ar: 'مستخدم', en: 'User' },
};

export const ACTION_LABEL: Record<string, Localized> = {
  'account.blocked': { ar: 'حُظر حساب', en: 'Account blocked' },
  'account.unblocked': { ar: 'رُفع الحظر عن حساب', en: 'Account unblocked' },
  'article.deleted': { ar: 'حُذف مقال', en: 'Article deleted' },
  'attendance.corrected': { ar: 'صُحّح حضور', en: 'Attendance corrected' },
  'attendance.event_finalized': { ar: 'اعتُمد حضور الفعالية', en: 'Event attendance finalised' },
  'attendance.recorded': { ar: 'سُجّل حضور', en: 'Attendance recorded' },
  'attendance.session_closed': { ar: 'أُغلقت جلسة حضور', en: 'Attendance session closed' },
  'attendance.session_finalized': { ar: 'اعتُمدت جلسة حضور', en: 'Attendance session finalised' },
  'attendance.session_opened': { ar: 'فُتحت جلسة حضور', en: 'Attendance session opened' },
  'attendance.session_reopened': { ar: 'أُعيد فتح جلسة حضور', en: 'Attendance session reopened' },
  'certificate.issued': { ar: 'صدرت شهادة', en: 'Certificate issued' },
  'committee.created': { ar: 'أُنشئت لجنة', en: 'Committee created' },
  'committee.deactivated': { ar: 'عُطّلت لجنة', en: 'Committee deactivated' },
  'committee.deleted': { ar: 'حُذفت لجنة', en: 'Committee deleted' },
  'committee.reactivated': { ar: 'أُعيد تفعيل لجنة', en: 'Committee reactivated' },
  'committee.updated': { ar: 'عُدّلت لجنة', en: 'Committee updated' },
  'event.deleted': { ar: 'حُذفت فعالية', en: 'Event deleted' },
  'member.activated': { ar: 'فعّل العضو حسابه', en: 'Member activated the account' },
  'member.card_rotated': { ar: 'غُيّر رمز بطاقة العضو', en: 'Member card code changed' },
  'member.claim_invited': { ar: 'أُرسلت دعوة مطالبة بالسجل', en: 'Claim invitation sent' },
  'member.claimed': { ar: 'طالب العضو بسجله', en: 'Member claimed the record' },
  'member.created': { ar: 'أُنشئ عضو', en: 'Member created' },
  'member.leave_approved': { ar: 'وُوفق على مغادرة عضو', en: 'Leave request approved' },
  'member.leave_declined': { ar: 'رُفض طلب مغادرة', en: 'Leave request declined' },
  'member.leave_requested': { ar: 'طلب عضو المغادرة', en: 'Member asked to leave' },
  'member.leave_withdrawn': { ar: 'سحب العضو طلب المغادرة', en: 'Leave request withdrawn' },
  'member.note_added': {
    ar: 'أُضيفت ملاحظة داخلية على عضو',
    en: 'Internal note added on a member',
  },
  'member.photo_removed': { ar: 'حذف العضو صورته', en: 'Member removed the photo' },
  'member.photo_updated': { ar: 'غيّر العضو صورته', en: 'Member changed the photo' },
  'member.profile_updated': { ar: 'حدّث العضو ملفه', en: 'Member updated the profile' },
  'member.project_deleted_by_staff': {
    ar: 'حذفت القيادة مشروع عضو',
    en: 'Leadership deleted a member project',
  },
  'member.project_saved_by_staff': {
    ar: 'حفظت القيادة مشروع عضو',
    en: 'Leadership saved a member project',
  },
  'member.renewal_requested': { ar: 'طلب العضو التجديد', en: 'Member asked for a renewal' },
  'member.renewed': { ar: 'جُدّدت عضوية', en: 'Membership renewed' },
  'member.role_changed': { ar: 'تغيّر منصب عضو في لجنة', en: 'Member committee position changed' },
  'member.skills_updated': { ar: 'حدّث العضو مهاراته', en: 'Member updated the skills' },
  'member.skills_updated_by_staff': {
    ar: 'حدّثت القيادة مهارات عضو',
    en: 'Leadership updated member skills',
  },
  'member.suspended': { ar: 'أُوقفت عضوية مؤقتاً', en: 'Membership suspended' },
  'member.reinstated': { ar: 'أُعيدت عضوية', en: 'Membership reinstated' },
  'member.ended': { ar: 'انتهت عضوية', en: 'Membership ended' },
  'member.updated_by_staff': {
    ar: 'صحّحت القيادة بيانات عضو',
    en: 'Leadership corrected member data',
  },
  'membership_application.accepted': { ar: 'تم قبول طلب عضوية', en: 'Application accepted' },
  'membership_application.rejected': { ar: 'رُفض طلب عضوية', en: 'Application rejected' },
  'membership_application.waitlisted': {
    ar: 'نُقل طلب إلى الانتظار',
    en: 'Application waitlisted',
  },
  'membership_application.decision_undone': {
    ar: 'تُراجع عن قرار في طلب',
    en: 'Application decision undone',
  },
  'membership_application.info_requested': {
    ar: 'طُلب تعديل من متقدّم',
    en: 'Applicant asked to edit',
  },
  'membership_application.lapsed': {
    ar: 'سقط تفعيل متقدّم مقبول',
    en: 'Accepted applicant did not activate',
  },
  'membership_application.restored': { ar: 'أُعيد مقعد متقدّم', en: 'Applicant place restored' },
  'membership_application.resubmitted': {
    ar: 'أعاد متقدّم إرسال طلبه',
    en: 'Applicant resubmitted',
  },
  'membership_application.scored': { ar: 'قُيّم طلب عضوية', en: 'Application scored' },
  'membership_application.submitted': { ar: 'وصل طلب عضوية', en: 'Application received' },
  'membership_application.updated': { ar: 'عُدّل طلب عضوية', en: 'Application updated' },
  'membership_application.withdrawn': { ar: 'سُحب طلب عضوية', en: 'Application withdrawn' },
  'membership_cycle.created': { ar: 'أُنشئت دورة عضوية', en: 'Cycle created' },
  'membership_cycle.deleted': { ar: 'حُذفت دورة عضوية', en: 'Cycle deleted' },
  'membership_cycle.updated': { ar: 'عُدّلت دورة عضوية', en: 'Cycle updated' },
  'partner.create': { ar: 'أُضيف شريك', en: 'Partner added' },
  'partner.delete': { ar: 'حُذف شريك', en: 'Partner deleted' },
  'partner.update': { ar: 'عُدّل شريك', en: 'Partner updated' },
  'privacy.deletion_requested': { ar: 'طُلب حذف بيانات', en: 'Data deletion requested' },
  'privacy.retention_run': { ar: 'تشغيل سياسة الاحتفاظ بالبيانات', en: 'Data retention run' },
  'registration.cancelled': { ar: 'أُلغي تسجيل', en: 'Registration cancelled' },
  'registration.created': { ar: 'أُنشئ تسجيل', en: 'Registration created' },
  'role.assigned': { ar: 'عُيّن في منصب', en: 'Position assigned' },
  'role.deleted': { ar: 'حُذف منصب', en: 'Position deleted' },
  'role.ended': { ar: 'انتهى منصب', en: 'Position ended' },
  'role.updated': { ar: 'عُدّل منصب', en: 'Position updated' },
  'settings.update': { ar: 'عُدّلت إعدادات الموقع', en: 'Site settings updated' },
  'tag.delete': { ar: 'حُذف وسم', en: 'Tag deleted' },
  'tag.update': { ar: 'عُدّل وسم', en: 'Tag updated' },
};

/** Verbs used by actions that have no label of their own (so new actions still read as words). */
const VERB_LABEL: Record<string, Localized> = {
  created: { ar: 'إنشاء', en: 'created' },
  create: { ar: 'إنشاء', en: 'created' },
  updated: { ar: 'تعديل', en: 'updated' },
  update: { ar: 'تعديل', en: 'updated' },
  deleted: { ar: 'حذف', en: 'deleted' },
  delete: { ar: 'حذف', en: 'deleted' },
  assigned: { ar: 'تعيين', en: 'assigned' },
  ended: { ar: 'إنهاء', en: 'ended' },
  accepted: { ar: 'قبول', en: 'accepted' },
  rejected: { ar: 'رفض', en: 'rejected' },
  cancelled: { ar: 'إلغاء', en: 'cancelled' },
  issued: { ar: 'إصدار', en: 'issued' },
  recorded: { ar: 'تسجيل', en: 'recorded' },
  renewed: { ar: 'تجديد', en: 'renewed' },
};

const humanise = (code: string) => code.replace(/[._]+/g, ' ').trim();

export function actionLabel(action: string, lang: Lang): string {
  const known = ACTION_LABEL[action];
  if (known) return known[lang];
  const [entity = '', verb = ''] = action.split('.');
  const e = ENTITY_LABEL[entity];
  const v = VERB_LABEL[verb];
  if (e && v) return lang === 'ar' ? `${v.ar}: ${e.ar}` : `${e.en} ${v.en}`;
  return humanise(action);
}

export function entityLabel(entity: string, lang: Lang): string {
  return ENTITY_LABEL[entity]?.[lang] ?? humanise(entity);
}

const FIELD_LABEL: Record<string, Localized> = {
  user_id: { ar: 'المستخدم', en: 'User' },
  role_key: { ar: 'المنصب', en: 'Position' },
  role: { ar: 'المنصب', en: 'Position' },
  committee: { ar: 'اللجنة', en: 'Committee' },
  committee_id: { ar: 'اللجنة', en: 'Committee' },
  starts_at: { ar: 'يبدأ في', en: 'Starts' },
  ends_at: { ar: 'ينتهي في', en: 'Ends' },
  end_reason: { ar: 'سبب الإنهاء', en: 'End reason' },
  fields: { ar: 'الحقول المعدّلة', en: 'Fields changed' },
  count: { ar: 'العدد', en: 'Count' },
  project: { ar: 'المشروع', en: 'Project' },
  reason: { ar: 'السبب', en: 'Reason' },
  note: { ar: 'الملاحظة', en: 'Note' },
  change: { ar: 'التغيير', en: 'Change' },
  via: { ar: 'عبر', en: 'Via' },
  status: { ar: 'الحالة', en: 'Status' },
  email: { ar: 'البريد', en: 'E-mail' },
  name: { ar: 'الاسم', en: 'Name' },
  title: { ar: 'العنوان', en: 'Title' },
  decision: { ar: 'القرار', en: 'Decision' },
  average: { ar: 'متوسط التقييم', en: 'Average score' },
  slug: { ar: 'المعرّف', en: 'Slug' },
};

const BASE_FIELD: Record<string, Localized> = {
  first_name: { ar: 'الاسم الأول', en: 'First name' },
  middle_name: { ar: 'الاسم الأوسط', en: 'Middle name' },
  last_name: { ar: 'الاسم الأخير', en: 'Last name' },
  headline: { ar: 'العنوان المهني', en: 'Headline' },
  about: { ar: 'النبذة', en: 'About' },
  open_to: { ar: 'متاح لـ', en: 'Open to' },
  phone: { ar: 'الجوال', en: 'Phone' },
  academic_status: { ar: 'الحالة الأكاديمية', en: 'Academic status' },
  university_id: { ar: 'الجامعة', en: 'University' },
  major_id: { ar: 'التخصص', en: 'Major' },
  sub_major_id: { ar: 'التخصص الفرعي', en: 'Sub-major' },
  track_id: { ar: 'المسار', en: 'Track' },
  portfolio_url: { ar: 'رابط المعرض', en: 'Portfolio link' },
  github_url: { ar: 'GitHub', en: 'GitHub' },
  linkedin_url: { ar: 'LinkedIn', en: 'LinkedIn' },
  x_url: { ar: 'X', en: 'X' },
  website_url: { ar: 'الموقع', en: 'Website' },
  behance_url: { ar: 'Behance', en: 'Behance' },
  dribbble_url: { ar: 'Dribbble', en: 'Dribbble' },
  youtube_url: { ar: 'YouTube', en: 'YouTube' },
  is_directory_visible: { ar: 'الظهور في الدليل', en: 'Directory visibility' },
  show_photo: { ar: 'إظهار الصورة', en: 'Show photo' },
  show_headline: { ar: 'إظهار العنوان', en: 'Show headline' },
  show_about: { ar: 'إظهار النبذة', en: 'Show about' },
  show_skills: { ar: 'إظهار المهارات', en: 'Show skills' },
  show_projects: { ar: 'إظهار المشاريع', en: 'Show projects' },
  show_open_to: { ar: 'إظهار «متاح لـ»', en: 'Show open to' },
  show_university: { ar: 'إظهار الجامعة', en: 'Show university' },
  show_track: { ar: 'إظهار المسار', en: 'Show track' },
  show_participation: { ar: 'إظهار الفعاليات', en: 'Show events' },
};

export function fieldLabel(key: string, lang: Lang): string {
  const direct = FIELD_LABEL[key] ?? BASE_FIELD[key];
  if (direct) return direct[lang];
  const m = /^(.*)_(ar|en)$/.exec(key);
  const base = m && BASE_FIELD[m[1]!];
  if (base)
    return `${base[lang]} (${m[2] === 'ar' ? (lang === 'ar' ? 'عربي' : 'Arabic') : lang === 'ar' ? 'إنجليزي' : 'English'})`;
  return humanise(key);
}

const ROLE_LABEL: Record<string, Localized> = {
  system_admin: { ar: 'مدير النظام', en: 'System administrator' },
  community_leader: { ar: 'قائد المجتمع', en: 'Community leader' },
  founder: { ar: 'مؤسس', en: 'Founder' },
  committee_head: { ar: 'قائد لجنة', en: 'Committee head' },
  committee_deputy: { ar: 'نائب قائد لجنة', en: 'Committee deputy' },
  committee_member: { ar: 'عضو لجنة', en: 'Committee member' },
  advisor: { ar: 'مستشار', en: 'Advisor' },
};
const CHANGE_LABEL: Record<string, Localized> = {
  assigned: { ar: 'تعيين', en: 'Assigned' },
  ended: { ar: 'إنهاء', en: 'Ended' },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** One value of the summary, as words: dates localised, flags yes/no, codes translated, ids shortened. */
export function valueLabel(key: string, value: unknown, lang: Lang): string {
  const ar = lang === 'ar';
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? (ar ? 'نعم' : 'Yes') : ar ? 'لا' : 'No';
  if (Array.isArray(value))
    return value.map((v) => valueLabel(key, v, lang)).join(ar ? '، ' : ', ');
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  if (ISO.test(s)) {
    return new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Riyadh',
    }).format(new Date(s));
  }
  if (UUID.test(s)) return `#${s.slice(-6)}`;
  if (key === 'role_key' || key === 'role') return ROLE_LABEL[s]?.[lang] ?? humanise(s);
  if (key === 'change') return CHANGE_LABEL[s]?.[lang] ?? humanise(s);
  if (key === 'fields') return fieldLabel(s, lang);
  return s;
}

/** The action filter groups actions by their first part (`member.renewed` → `member`). */
const ACTION_GROUP_LABEL: Record<string, Localized> = {
  account: { ar: 'الحسابات', en: 'Accounts' },
  article: { ar: 'المقالات', en: 'Articles' },
  attendance: { ar: 'الحضور', en: 'Attendance' },
  certificate: { ar: 'الشهادات', en: 'Certificates' },
  committee: { ar: 'اللجان', en: 'Committees' },
  event: { ar: 'الفعاليات', en: 'Events' },
  member: { ar: 'الأعضاء', en: 'Members' },
  membership_application: { ar: 'طلبات العضوية', en: 'Membership applications' },
  membership_cycle: { ar: 'دورات العضوية', en: 'Membership cycles' },
  partner: { ar: 'الشركاء', en: 'Partners' },
  privacy: { ar: 'الخصوصية والبيانات', en: 'Privacy and data' },
  registration: { ar: 'تسجيلات الفعاليات', en: 'Event registrations' },
  role: { ar: 'المناصب والصلاحيات', en: 'Positions and permissions' },
  settings: { ar: 'إعدادات الموقع', en: 'Site settings' },
  tag: { ar: 'الوسوم', en: 'Tags' },
  user: { ar: 'المستخدمون', en: 'Users' },
};

export function actionGroupLabel(group: string, lang: Lang): string {
  return ACTION_GROUP_LABEL[group]?.[lang] ?? ENTITY_LABEL[group]?.[lang] ?? humanise(group);
}
