import { notFound } from 'next/navigation';

// Unknown URLs inside a locale render the branded 404 (app/[locale]/not-found.tsx).
export default function CatchAll() {
  notFound();
}
