'use server';

import { revalidatePath } from 'next/cache';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { memberCode, memberMessage } from './messages';
import {
  PHOTO_MAX_BYTES,
  memberPhotoPaths,
  sniffImageType,
  thumbPathOf,
  type PhotoExt,
} from './photo';
import { memberPhotoUrl, memberThumbUrl } from './photo-url';

/**
 * Member photo Server Actions (MEM-012). The browser has already cropped and resized the picture (512 px and
 * 128 px), so both files are tiny. The server still checks type (by the real bytes) and size, writes inside the
 * member's own folder with the member's own session (the bucket policy decides), then records the path through one
 * database function and removes the files it replaced. Nothing is written to a public view here: the photo becomes
 * public only when the member's `show_photo` is on.
 */
const BUCKET = 'member-photos';
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const failCode = (code: ErrorCode, lang: Lang) => fail(code, memberMessage(code, lang));

const EXT: Record<string, PhotoExt> = { 'image/webp': 'webp', 'image/jpeg': 'jpg' };

async function checkedFile(
  value: FormDataEntryValue | null,
): Promise<{ file: File; type: string } | ErrorCode> {
  if (!(value instanceof File) || value.size === 0) return 'VALIDATION_FAILED';
  if (value.size > PHOTO_MAX_BYTES) return 'FILE_TOO_LARGE';
  const type = sniffImageType(new Uint8Array(await value.slice(0, 16).arrayBuffer()));
  if (!type || !EXT[type]) return 'FILE_TYPE';
  return { file: value, type };
}

export async function uploadMyPhoto(
  formData: FormData,
  ctx: { lang: Lang },
): Promise<Result<{ path: string; url: string; thumbUrl: string }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);

  const full = await checkedFile(formData.get('full'));
  if (typeof full === 'string') return failCode(full, lang);
  const thumb = await checkedFile(formData.get('thumb'));
  if (typeof thumb === 'string') return failCode(thumb, lang);
  // Both files are written with the same extension, so the thumbnail path can be derived from the photo path.
  if (full.type !== thumb.type) return failCode('FILE_TYPE', lang);
  const show = formData.get('show');

  const ext = EXT[full.type]!;
  const paths = memberPhotoPaths(access.userId, crypto.randomUUID(), ext);

  const supabase = await createClient();
  const a = await supabase.storage.from(BUCKET).upload(paths.full, full.file, {
    contentType: full.type,
    upsert: false,
  });
  if (a.error) return failCode('FORBIDDEN', lang);
  const b = await supabase.storage.from(BUCKET).upload(paths.thumb, thumb.file, {
    contentType: thumb.type,
    upsert: false,
  });
  if (b.error) {
    await supabase.storage.from(BUCKET).remove([paths.full]);
    return failCode('FORBIDDEN', lang);
  }

  const { data, error } = await supabase.rpc('set_my_member_photo', {
    p_path: paths.full,
    ...(show === 'true' ? { p_show: true } : show === 'false' ? { p_show: false } : {}),
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([paths.full, paths.thumb]);
    const code = memberCode(error);
    return failCode(code, lang);
  }

  // The replaced photo and its thumbnail are deleted so no old picture lingers.
  const old = data as string | null;
  if (old) await supabase.storage.from(BUCKET).remove([old, thumbPathOf(old)]);

  revalidatePath('/', 'layout');
  return ok({
    path: paths.full,
    url: memberPhotoUrl(paths.full)!,
    thumbUrl: memberThumbUrl(paths.full)!,
  });
}

export async function removeMyPhoto(ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('remove_my_member_photo');
  if (error) return failCode(memberCode(error), lang);
  const old = data as string | null;
  if (old) await supabase.storage.from(BUCKET).remove([old, thumbPathOf(old)]);
  revalidatePath('/', 'layout');
  return ok(undefined);
}
