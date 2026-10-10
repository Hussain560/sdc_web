import { CommitteesIndexView } from '@/modules/committees/components/public/CommitteesIndexView';
import { listPublicCommittees } from '@/modules/committees/queries';

export const revalidate = 60;

export default async function CommitteesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <CommitteesIndexView
      lang={locale === 'en' ? 'en' : 'ar'}
      committees={await listPublicCommittees()}
    />
  );
}
