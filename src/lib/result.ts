/**
 * Uniform outcome of Server Actions (docs/04-architecture/server-logic-and-data-access.md §5).
 * Codes are machine-readable; `message` is already localized for the caller's language.
 */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'WEAK_PASSWORD'
  | 'SAME_PASSWORD'
  | 'RATE_LIMITED'
  | 'LINK_EXPIRED'
  | 'EMAIL_IN_USE'
  | 'ESCALATION_DENIED'
  | 'SCOPE_REQUIRED'
  | 'SCOPE_FORBIDDEN'
  | 'NOT_ACTIVE_MEMBER'
  | 'HEAD_ALREADY_ACTIVE'
  | 'LEADER_ALREADY_ACTIVE'
  | 'LAST_ADMIN'
  | 'SELF_ASSIGNMENT'
  | 'INVALID_DATE'
  | 'SLUG_TAKEN'
  | 'ALREADY_ASSIGNED'
  | 'ALREADY_ENDED'
  | 'REASON_REQUIRED'
  | 'COMMITTEE_INACTIVE'
  | 'PUBLISH_GUARD'
  | 'INCOMPLETE'
  | 'NOTE_TOO_SHORT'
  | 'NOT_EDITABLE'
  | 'NOT_DELETABLE'
  | 'STALE_DATA'
  | 'SLUG_LOCKED'
  | 'EVENT_NOT_ENDED'
  | 'INVALID_TRANSITION'
  | 'FILE_TOO_LARGE'
  | 'FILE_TYPE'
  | 'ALREADY_REGISTERED'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_FULL'
  | 'MEMBERS_ONLY'
  | 'TOO_LATE_TO_CANCEL'
  | 'CAPACITY_REACHED'
  | 'INTERNAL';

export type Result<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = (
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): Result<never> => ({ ok: false, code, message, ...(fieldErrors ? { fieldErrors } : {}) });
