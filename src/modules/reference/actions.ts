'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { fail, ok, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { accessMessage } from '@/modules/access/messages';

/**
 * Reference lists (docs/05-database/entities/reference-data.md): add, rename, (de)activate. Values are never
 * deleted — a used value is deactivated instead. RLS (`reference_data.manage`) is the real gate.
 */
export type ReferenceTable = 'universities' | 'majors' | 'tracks';

const input = z.object({
  table: z.enum(['universities', 'majors', 'tracks']),
  id: z.number().int().positive().optional(),
  nameAr: z.string().trim().min(2).max(150),
  nameEn: z.string().trim().max(150).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(32000).optional(),
});

export type ReferenceInput = z.input<typeof input>;

const text = {
  invalid: {
    ar: 'تحقق من الاسم (حرفان على الأقل).',
    en: 'Check the name (at least 2 characters).',
  },
  duplicate: { ar: 'هذه القيمة موجودة بالفعل.', en: 'This value already exists.' },
};

export async function saveReference(raw: ReferenceInput, ctx: { lang: Lang }): Promise<Result> {
  const lang: Lang = isLang(ctx?.lang) ? ctx.lang : 'ar';
  if (!(await getAccess())) return fail('UNAUTHENTICATED', accessMessage('UNAUTHENTICATED', lang));
  const parsed = input.safeParse(raw);
  if (!parsed.success) return fail('VALIDATION_FAILED', text.invalid[lang]);
  const v = parsed.data;

  const row: Record<string, unknown> = { name_ar: v.nameAr, name_en: v.nameEn || null };
  if (v.isActive !== undefined) row.is_active = v.isActive;
  if (v.table !== 'majors' && v.displayOrder !== undefined) row.display_order = v.displayOrder;
  if (v.table === 'majors' && v.parentId !== undefined) row.parent_id = v.parentId;

  const supabase = await createClient();
  const q = v.id
    ? supabase
        .from(v.table)
        .update(row as never)
        .eq('id', v.id)
    : supabase.from(v.table).insert(row as never);
  const { error } = await q;
  if (error) {
    if (error.code === '23505') return fail('ALREADY_EXISTS', text.duplicate[lang]);
    if (error.code === '42501') return fail('FORBIDDEN', accessMessage('FORBIDDEN', lang));
    console.error('[reference] write failed', error.code);
    return fail('INTERNAL', accessMessage('INTERNAL', lang));
  }
  revalidatePath('/', 'layout');
  return ok(undefined);
}
