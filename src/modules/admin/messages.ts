import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const fieldLabel: Record<string, { ar: string; en: string }> = {
  social_instagram: { ar: 'رابط إنستغرام', en: 'Instagram link' },
  social_linkedin: { ar: 'رابط لينكدإن', en: 'LinkedIn link' },
  social_x: { ar: 'رابط X', en: 'X link' },
  contact_email: { ar: 'البريد', en: 'contact e-mail' },
  community_whatsapp_link: { ar: 'رابط مجموعة واتساب', en: 'WhatsApp group link' },
  footer_rights_ar: { ar: 'نص الحقوق بالعربية', en: 'Arabic rights text' },
  footer_rights_en: { ar: 'نص الحقوق بالإنجليزية', en: 'English rights text' },
  certificates_enabled: { ar: 'تفعيل الشهادات', en: 'certificates switch' },
  certificate_threshold: { ar: 'نسبة الحضور المطلوبة', en: 'attendance threshold' },
  name_ar: { ar: 'الاسم بالعربية', en: 'Arabic name' },
  name_en: { ar: 'الاسم بالإنجليزية', en: 'English name' },
  logo_url: { ar: 'رابط الشعار', en: 'logo link' },
  website_url: { ar: 'رابط الموقع', en: 'website link' },
  display_order: { ar: 'الترتيب', en: 'order' },
  label_ar: { ar: 'الاسم بالعربية', en: 'Arabic label' },
  label_en: { ar: 'الاسم بالإنجليزية', en: 'English label' },
};

/** Field → the key the forms use for inline errors. */
export const FIELD_KEY: Record<string, string> = {
  social_instagram: 'socialInstagram',
  social_linkedin: 'socialLinkedin',
  social_x: 'socialX',
  contact_email: 'contactEmail',
  community_whatsapp_link: 'whatsappLink',
  footer_rights_ar: 'footerRightsAr',
  footer_rights_en: 'footerRightsEn',
  certificate_threshold: 'certificateThreshold',
  name_ar: 'nameAr',
  name_en: 'nameEn',
  logo_url: 'logoUrl',
  website_url: 'websiteUrl',
  display_order: 'displayOrder',
  label_ar: 'labelAr',
  label_en: 'labelEn',
};

const CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'NOT_DELETABLE',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  NOT_DELETABLE: {
    ar: 'هذا الوسم مستخدم في مقالات ولا يمكن حذفه.',
    en: 'This tag is used by threads and cannot be deleted.',
  },
  VALIDATION_FAILED: {
    ar: 'يرجى مراجعة الحقول المحددة.',
    en: 'Please review the highlighted fields.',
  },
};

export function adminMessage(code: ErrorCode, lang: Lang, field?: string): string {
  const base = messages[code]?.[lang] ?? accessMessage(code, lang);
  if (field && code === 'VALIDATION_FAILED')
    return `${base}: ${fieldLabel[field]?.[lang] ?? field}`;
  return base;
}

export function parseAdminDbError(error: { message?: string; code?: string }): {
  code: ErrorCode;
  field?: string;
} {
  const msg = (error.message ?? '').trim();
  const prefixed = /^VALIDATION_FAILED:(\w+)$/.exec(msg);
  if (prefixed) return { code: 'VALIDATION_FAILED', field: prefixed[1] };
  if (msg === 'IN_USE') return { code: 'NOT_DELETABLE' };
  if ((CODES as readonly string[]).includes(msg)) return { code: msg as ErrorCode };
  if (error.code === '42501') return { code: 'FORBIDDEN' };
  if (['23514', '22P02'].includes(error.code ?? '')) return { code: 'VALIDATION_FAILED' };
  return { code: 'INTERNAL' };
}
