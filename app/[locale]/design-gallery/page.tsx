import { notFound } from 'next/navigation';
import { Gallery } from '@/components/gallery/Gallery';

// Developer-only: every Design System v2 component with its states. Hidden in production unless
// DESIGN_GALLERY=1 (the Playwright run sets it) so it never ships to visitors.
export const dynamic = 'force-dynamic';

export default function DesignGalleryPage() {
  if (process.env.NODE_ENV === 'production' && process.env.DESIGN_GALLERY !== '1') notFound();
  return <Gallery />;
}
