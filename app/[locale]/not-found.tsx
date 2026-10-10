import type { Metadata } from 'next';
import NotFound from '@/components/NotFound/NotFound';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NotFoundPage() {
  return <NotFound />;
}
