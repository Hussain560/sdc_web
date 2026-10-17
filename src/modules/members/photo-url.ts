import { clientEnv } from '@/lib/env';
import { thumbPathOf } from './photo';

const base = () => `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/member-photos`;

/** Public address of a member photo (512 px). Only pass a path the database handed out for a public photo. */
export const memberPhotoUrl = (path: string | null | undefined): string | null =>
  path ? `${base()}/${path}` : null;

/** The 128 px thumbnail that belongs to the same photo (cards, lists, the account menu). */
export const memberThumbUrl = (path: string | null | undefined): string | null =>
  path ? `${base()}/${thumbPathOf(path)}` : null;
