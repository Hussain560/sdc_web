import { MembersView } from '@/modules/members/components/public/MembersView';
import {
  PAGE_SIZE,
  getDirectoryFacets,
  getSkillCatalog,
  listDirectoryPage,
} from '@/modules/members/public';

type SP = { q?: string; skill?: string; committee?: string; track?: string; n?: string };

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
    skill: (sp.skill ?? '').slice(0, 60),
    committee: (sp.committee ?? '').slice(0, 60),
    track: (sp.track ?? '').slice(0, 120),
    n,
  };

  const [page, facets, skills] = await Promise.all([
    listDirectoryPage(query, lang).then(
      (r) => ({ ...r, failed: false }),
      () => ({ total: 0, items: [], failed: true }),
    ),
    getDirectoryFacets(),
    getSkillCatalog(),
  ]);
  return (
    <MembersView
      lang={lang}
      members={page.items}
      total={page.total}
      facets={facets}
      skills={skills}
      query={query}
      loadError={page.failed}
    />
  );
}
