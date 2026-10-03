import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { deliverCertificate, readCertificatePdf } from '@/modules/attendance/certificates';

export const dynamic = 'force-dynamic';

/**
 * Certificate download. RLS decides who may even see the row (its owner, or organizers holding events.complete);
 * the PDF itself lives in a private bucket and is read with the server key only after that check (AT-9).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Not found', { status: 404 });
  if (!(await getUser())) return new NextResponse('Unauthorized', { status: 401 });

  const supabase = await createClient();
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
