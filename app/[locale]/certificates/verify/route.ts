import { NextResponse } from 'next/server';

/** Forwards the verify form to the certificate page. Only a well-formed uuid is accepted, so nothing is echoed. */
export function GET(req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id')?.trim() ?? '';
  return params.then(({ locale }) => {
    const prefix = locale === 'en' ? '/en' : '';
    const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    return NextResponse.redirect(
      new URL(ok ? `${prefix}/certificates/${id.toLowerCase()}` : `${prefix}/certificates`, url),
    );
  });
}
