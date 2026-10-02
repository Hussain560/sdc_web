'use server';

import { revalidatePath } from 'next/cache';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { eventMessage, parseEventDbError } from './messages';
import { toPayload } from './mapping';
import { validateDraft } from './schemas';
import type { EventFormValues } from './types';

/**
 * Event Server Actions. Pattern (server-logic §3): authenticate → validate → ONE database function call that
 * re-checks authorization and the lifecycle guards → revalidate → Result. The SQL functions are authoritative.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const { code, field } = parseEventDbError(error);
  // Unknown failures are logged for operators (never shown to the user); no payload or personal data is logged.
  if (code === 'INTERNAL')
    console.error('[events] unexpected database error', error.code, error.message);
  return fail(
    code,
    eventMessage(code, lang, field),
    field ? { [field]: eventMessage(code, lang, field) } : undefined,
  );
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, eventMessage(code, lang));

export type SavedEvent = {
  id: string;
  slug: string;
  status: string;
  updatedAt: string;
  significantChange: boolean;
};

/** Create (no id) or update a draft/published event from the wizard. */
export async function saveEvent(
  input: { id?: string; values: EventFormValues; expectedUpdatedAt?: string },
  ctx: { lang: Lang },
): Promise<Result<SavedEvent>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const draft = validateDraft(input.values, lang);
  if (!draft.ok)
    return fail('VALIDATION_FAILED', eventMessage('VALIDATION_FAILED', lang), draft.errors);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_event', {
    // null (not undefined) so PostgREST resolves save_event(uuid, jsonb, timestamptz) for new events
    p_event_id: (input.id ?? null) as string,
    p: toPayload(input.values) as never,
    p_expected_updated_at: input.expectedUpdatedAt,
  });
  if (error) return dbFailure(error, lang);

  const r = data as {
    id: string;
    slug: string;
    status: string;
    updated_at: string;
    significant_change: boolean;
  };
  revalidatePath('/', 'layout');
  return ok({
    id: r.id,
    slug: r.slug,
    status: r.status,
    updatedAt: r.updated_at,
    significantChange: r.significant_change,
  });
}

export type TransitionAction =
  'submit' | 'withdraw' | 'approve' | 'request_changes' | 'cancel' | 'complete' | 'archive';

export async function transitionEvent(
  input: { id: string; action: TransitionAction; note?: string },
  ctx: { lang: Lang },
): Promise<Result<{ status: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!/^[0-9a-f-]{36}$/i.test(input.id)) return failCode('NOT_FOUND', lang);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('transition_event', {
    p_id: input.id,
    p_action: input.action,
    p_note: input.note,
  });
  if (error) return dbFailure(error, lang);

  revalidatePath('/', 'layout');
  return ok({ status: data as string });
}

export async function deleteEventDraft(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_event_draft', { p_id: id });
  if (error) return dbFailure(error, lang);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

const ALLOWED_IMAGE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Cover upload (EV-11): type and size are checked here and again by the bucket configuration. */
export async function uploadEventCover(
  formData: FormData,
  ctx: { lang: Lang },
): Promise<Result<{ path: string; url: string }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);

  const file = formData.get('file');
  if (!(file instanceof File)) return failCode('VALIDATION_FAILED', lang);
  const ext = ALLOWED_IMAGE[file.type as keyof typeof ALLOWED_IMAGE];
  if (!ext) return failCode('FILE_TYPE', lang);
  if (file.size > MAX_IMAGE_BYTES) return failCode('FILE_TOO_LARGE', lang);

  const eventId = String(formData.get('eventId') ?? '');
  const folder = /^[0-9a-f-]{36}$/i.test(eventId) ? eventId : `drafts/${access.userId}`;
  const path = `events/${folder}/cover-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from('public-media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return failCode('FORBIDDEN', lang);

  const { data } = supabase.storage.from('public-media').getPublicUrl(path);
  return ok({ path, url: data.publicUrl });
}

/** Wizard typeahead for presenter accounts (names only). */
export async function searchPresenterCandidates(
  query: string,
): Promise<Array<{ id: string; name: string }>> {
  if (!(await getAccess())) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc('search_presenter_candidates', { p_query: q });
  return (data ?? []).map((r) => ({ id: r.id, name: r.full_name_ar }));
}
