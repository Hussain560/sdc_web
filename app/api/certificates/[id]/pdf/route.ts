import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliverCertificate, readCertificatePdf } from '@/modules/attendance/certificates';

export const dynamic = 'force-dynamic';

/**
 * Certificate download for everyone who holds the link: participants do not need an account, so the certificate id
 * (an unguessable uuid, already the key of the public verification page) is the secret. The e-mail carries the
 * link. The PDF lives in a private bucket and is read with the server key. Same facts as the verification page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Not found', { status: 404 });

  const supabase = createAdminClient();
  const { data: cert } = await supabase
    .from('certificates')
    .select('id, pdf_path, recipient_name')
    .eq('id', id)
    .maybeSingle();
  if (!cert) return new NextResponse('Not found', { status: 404 });

  // A certificate whose PDF is not stored yet is generated on first download.
  let path = cert.pdf_path;
  if (!path) {
    await deliverCertificate(cert.id);
    const { data: again } = await supabase
      .from('certificates')
      .select('pdf_path')
      .eq('id', id)
      .maybeSingle();
    path = again?.pdf_path ?? null;
  }
  const pdf = path ? await readCertificatePdf(path) : null;
  if (!pdf) return new NextResponse('Not available', { status: 404 });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificate-${id}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
