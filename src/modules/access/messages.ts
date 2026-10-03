import type { ErrorCode } from '@/lib/result';
import { errorMessage as authMessage, type Lang } from '@/modules/auth/messages';

/** Domain error codes raised by the SQL functions (`raise exception 'CODE' using errcode = 'P0001'`). */
export const DB_ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'ESCALATION_DENIED',
  'SCOPE_REQUIRED',
  'SCOPE_FORBIDDEN',
  'NOT_ACTIVE_MEMBER',
  'HEAD_ALREADY_ACTIVE',
  'LEADER_ALREADY_ACTIVE',
  'ALREADY_ASSIGNED',
  'LAST_ADMIN',
  'SELF_ASSIGNMENT',
  'INVALID_DATE',
  'REASON_REQUIRED',
  'ALREADY_ENDED',
  'COMMITTEE_INACTIVE',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  FORBIDDEN: {
    ar: 'ليس لديك صلاحية لهذا الإجراء.',
    en: "You don't have permission for this action.",
  },
  NOT_FOUND: { ar: 'العنصر غير موجود.', en: 'Not found.' },
  ESCALATION_DENIED: {
    ar: 'لا يمكنك منح صلاحية لا تملكها.',
    en: "You can't grant a role you don't hold.",
  },
  SCOPE_REQUIRED: { ar: 'هذا المنصب يتطلب لجنة.', en: 'This role requires a committee.' },
  SCOPE_FORBIDDEN: {
    ar: 'هذا المنصب عام ولا يرتبط بلجنة.',
    en: 'This role is global and cannot belong to a committee.',
  },
  NOT_ACTIVE_MEMBER: {
    ar: 'يجب أن يكون الشخص عضوًا فعّالًا.',
    en: 'The person must be an active member.',
  },
  HEAD_ALREADY_ACTIVE: {
    ar: 'للجنة قائد حالي — استخدم «تسليم القيادة» أو أنهِ فترته أولًا.',
    en: 'This committee already has an active head — use Handover or end that term first.',
  },
  LEADER_ALREADY_ACTIVE: {
    ar: 'للمجتمع قائد حالي — أنهِ فترته أولًا.',
    en: 'The community already has an active leader — end that term first.',
  },
  ALREADY_ASSIGNED: {
    ar: 'هذا الشخص يشغل هذا المنصب بالفعل في الفترة نفسها.',
    en: 'This person already holds this role for the same period.',
  },
  LAST_ADMIN: {
    ar: 'لا يمكن إزالة آخر مسؤول نظام.',
    en: "The last system admin can't be removed.",
  },
  SELF_ASSIGNMENT: {
    ar: 'لا يمكنك تعديل مناصبك بنفسك.',
    en: "You can't change your own positions.",
  },
  INVALID_DATE: {
    ar: 'تاريخ النهاية يجب ألا يسبق تاريخ البداية.',
    en: 'The end date must not be before the start date.',
  },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
  ALREADY_ENDED: { ar: 'انتهت هذه الفترة بالفعل.', en: 'This term has already ended.' },
  COMMITTEE_INACTIVE: { ar: 'اللجنة غير فعّالة.', en: 'The committee is inactive.' },
};

export function accessMessage(code: ErrorCode, lang: Lang): string {
  return messages[code]?.[lang] ?? authMessage(code, lang);
}

/** Maps a PostgREST/Postgres error from an RPC to a stable error code. */
export function codeFromDbError(error: { message?: string; code?: string }): ErrorCode {
  const msg = (error.message ?? '').trim();
  if ((DB_ERROR_CODES as readonly string[]).includes(msg)) return msg as ErrorCode;
  if (error.code === '42501') return 'FORBIDDEN';
  return 'INTERNAL';
}
