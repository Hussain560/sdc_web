import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type MyProfile = {
  id: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string | null;
  preferredLocale: 'ar' | 'en';
};

/** The signed-in user's own profile row (RLS limits the result to that row). */
export const getMyProfile = cache(async (userId: string): Promise<MyProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name_ar, full_name_en, preferred_locale')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    fullNameAr: data.full_name_ar,
    fullNameEn: data.full_name_en,
    preferredLocale: data.preferred_locale === 'en' ? 'en' : 'ar',
  };
});
