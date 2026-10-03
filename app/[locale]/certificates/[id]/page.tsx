import { notFound } from 'next/navigation';
import CertificateView from '@/modules/attendance/components/public/CertificateView';
import { verifyCertificate } from '@/modules/attendance/queries';

export const dynamic = 'force-dynamic';

/** AT-9: the certificate id is the key. Anyone with the link (the e-mail carries it) verifies and downloads it. */
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const facts = await verifyCertificate(id);
  if (!facts) notFound();
  return <CertificateView id={id} facts={facts} canDownload />;
}
