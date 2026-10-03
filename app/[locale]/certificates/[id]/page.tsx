import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import CertificateView from '@/modules/attendance/components/public/CertificateView';
import { verifyCertificate } from '@/modules/attendance/queries';

export const dynamic = 'force-dynamic';

/** Q-020 / AT-9: anyone can verify a certificate by its id; only its owner (or an organizer) sees the download. */
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const facts = await verifyCertificate(id);
  if (!facts) notFound();

  let canDownload = false;
  if (await getUser()) {
    const supabase = await createClient();
    const { data } = await supabase.from('certificates').select('id').eq('id', id).maybeSingle();
    canDownload = !!data;
  }
  return <CertificateView id={id} facts={facts} canDownload={canDownload} />;
}
