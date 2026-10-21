import { redirect } from '@/i18n/navigation';
import { ApplicationForm } from '@/modules/membership/components/ApplicationForm';
import { getJoinCycle, getReferenceData } from '@/modules/membership/queries';

/**
 * /join/apply — the application on its own screen (focused, no site header). Only while a cycle is open: in every
 * other state the person goes back to /join, which explains the state. The window is checked again by the database
 * when the application is sent.
 */
export default async function ApplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const cycle = await getJoinCycle();
  if (!cycle || cycle.phase !== 'open') return redirect({ href: '/join', locale: lang });
  const reference = await getReferenceData();
  return (
    <div className="min-h-dvh bg-canvas">
      <ApplicationForm cycle={cycle} reference={reference} />
    </div>
  );
}
