import type { EventStatus } from '@/components/ui/StatusPill';
import { eventViewState } from './view-state';
import type { PublicEventCard } from './public-types';

/** Public wording of every status pill (components §2.2, event page §4). */
export const PILL_LABEL: Record<EventStatus, { ar: string; en: string }> = {
  'opens-soon': { ar: 'يفتح التسجيل قريباً', en: 'Registration opens soon' },
  'registration-open': { ar: 'التسجيل مفتوح', en: 'Registration open' },
  'closes-soon': { ar: 'يُغلق قريباً', en: 'Closes soon' },
  'full-waitlist': { ar: 'مكتمل · قائمة انتظار', en: 'Full · waiting list' },
  full: { ar: 'اكتملت المقاعد', en: 'Full' },
  closed: { ar: 'التسجيل مغلق', en: 'Registration closed' },
  'members-only': { ar: 'للأعضاء', en: 'Members only' },
  registered: { ar: 'مسجّل', en: 'Registered' },
  'under-review': { ar: 'قيد المراجعة', en: 'Under review' },
  'on-waitlist': { ar: 'في قائمة الانتظار', en: 'On the waiting list' },
  'running-now': { ar: 'جارية الآن', en: 'Happening now' },
  finished: { ar: 'انتهت', en: 'Finished' },
  cancelled: { ar: 'أُلغيت', en: 'Cancelled' },
};

/**
 * The pill a list card shows. Cards only know the phase and the seats left, so this is the event-page state
 * for an anonymous visitor (the audience and waiting list are not on the card).
 */
export function cardPill(event: PublicEventCard, now: number): EventStatus {
  return eventViewState(
    {
      phase: event.phase,
      startDate: event.startDate,
      seats: event.seatsLeft === null ? null : Math.max(event.seatsLeft, 1),
      seatsLeft: event.seatsLeft,
      waitlistEnabled: false,
      audience: 'public',
      registrationStartAt: null,
      registrationEndAt: null,
    },
    { isMember: false, registration: null },
    null,
    now,
  ).pill as EventStatus;
}
