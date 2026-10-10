import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CertificateView from '@/modules/attendance/components/public/CertificateView';
import { verifyCertificate } from '@/modules/attendance/queries';

export const dynamic = 'force-dynamic';

// A certificate page carries a person's name: keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** AT-9: the certificate id is the key. Anyone with the link (the e-mail carries it) verifies and downloads it. */
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const facts = await verifyCertificate(id);
  if (!facts) notFound();
  return <CertificateView id={id} facts={facts} canDownload lang={locale === 'en' ? 'en' : 'ar'} />;
}
