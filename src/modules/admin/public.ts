import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

export type PublicPartner = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
};

/** Active partners for the home page, in the admin's order. An empty list hides the whole section (Q-021). */
export const listPublicPartners = unstable_cache(
  async (): Promise<PublicPartner[]> => {
    try {
      const { data } = await createPublicClient()
        .from('partners')
        .select('id, name_ar, name_en, logo_url, website_url')
        .order('display_order')
        .order('name_ar');
      return (data ?? []).map((p) => ({
        id: p.id,
        nameAr: p.name_ar,
        nameEn: p.name_en,
        logoUrl: p.logo_url,
        websiteUrl: p.website_url,
      }));
    } catch {
      return [];
    }
  },
  ['public-partners'],
  { tags: ['partners'], revalidate: 3600 },
);
