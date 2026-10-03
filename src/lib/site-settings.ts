import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

export { DEFAULT_SETTINGS, type PublicSettings } from './site-settings-defaults';
import { DEFAULT_SETTINGS, type PublicSettings } from './site-settings-defaults';

const KEYS: Record<string, keyof PublicSettings> = {
  social_instagram: 'socialInstagram',
  social_linkedin: 'socialLinkedin',
  social_x: 'socialX',
  contact_email: 'contactEmail',
  footer_rights_ar: 'footerRightsAr',
  footer_rights_en: 'footerRightsEn',
};

/** Cached across requests; the settings action calls `updateTag('site-settings')` so a save shows immediately. */
export const getPublicSettings = unstable_cache(
  async (): Promise<PublicSettings> => {
    const out = { ...DEFAULT_SETTINGS };
    try {
      const { data } = await createPublicClient().from('site_settings').select('key, value');
      for (const row of data ?? []) {
        const k = KEYS[row.key];
        if (
          k &&
          typeof row.value === 'string' &&
          (row.value !== '' || k.startsWith('footer') || k === 'contactEmail')
        )
          out[k] = row.value;
      }
    } catch {
      /* a database hiccup must never break a public page: fall back to the defaults */
    }
    return out;
  },
  ['public-site-settings'],
  { tags: ['site-settings'], revalidate: 3600 },
);
