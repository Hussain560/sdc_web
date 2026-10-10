import { MembersView } from '@/modules/members/components/public/MembersView';
import {
  PAGE_SIZE,
  filterDirectory,
  filterOptions,
  listDirectory,
  listLeadership,
} from '@/modules/members/public';

type SP = { q?: string; track?: string; university?: string; n?: string };

/** /members: leadership plus the consent-filtered directory. Search and filters live in the URL. */
export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const sp = await searchParams;
  const n = Math.min(Math.max(Number(sp.n) || PAGE_SIZE, PAGE_SIZE), 480);
  const query = {
    q: (sp.q ?? '').slice(0, 80),
    track: (sp.track ?? '').slice(0, 120),
    university: (sp.university ?? '').slice(0, 160),
    n,
  };

  const [all, leadership] = await Promise.all([listDirectory(), listLeadership()]);
  const { total, items } = filterDirectory(all, { ...query, limit: n }, lang);
  return (
    <MembersView
      lang={lang}
      leadership={leadership}
      members={items}
      total={total}
      options={filterOptions(all, lang)}
      query={query}
      hasAny={all.length > 0}
    />
  );
}
