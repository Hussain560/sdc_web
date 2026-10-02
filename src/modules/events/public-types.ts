import type { Lang } from '@/context/LanguageContext';
import { formatDateRange } from '@/lib/format';
import type { EventPhase } from './types';

/** What the public pages need about an event (client-safe: plain data, no database types). */
export type PublicEventCard = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  locationAr: string | null;
  locationEn: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  phase: EventPhase;
  cover: string;
  seatsLeft: number | null;
};

export type ListBlock = { ar: string[]; en: string[] };

export type PublicEventDetail = PublicEventCard & {
  mapUrl: string | null;
  awardsAr: string | null;
  awardsEn: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  audience: ListBlock;
  responsibilities: ListBlock;
  requirements: ListBlock;
  deliverables: ListBlock;
  benefits: ListBlock;
  faq: Array<{ qAr: string; qEn: string; aAr: string; aEn: string }>;
  show: { faq: boolean; details: boolean };
};

const pick = <T>(lang: Lang, ar: T, en: T | null | undefined): T => (lang === 'en' && en ? en : ar);

export const eventTitle = (e: PublicEventCard, lang: Lang) => pick(lang, e.titleAr, e.titleEn);
export const eventLocation = (e: PublicEventCard, lang: Lang) =>
  pick(lang, e.locationAr ?? '', e.locationEn) || (lang === 'en' ? 'Online' : 'أونلاين');

/** Public wording of the derived phase; "announced" keeps the existing "Coming Soon" badge. */
const STATUS: Record<EventPhase, { ar: string; en: string; tone: 'coming-soon' | 'available' }> = {
  announced: { ar: 'قريبًا', en: 'Coming Soon', tone: 'coming-soon' },
  registration_open: { ar: 'التسجيل متاح', en: 'Registration open', tone: 'available' },
  registration_closed: { ar: 'التسجيل مغلق', en: 'Registration closed', tone: 'available' },
  in_progress: { ar: 'جارية الآن', en: 'In progress', tone: 'available' },
  ended: { ar: 'منتهي', en: 'Ended', tone: 'available' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled', tone: 'available' },
};
export const statusLabel = (phase: EventPhase, lang: Lang) => STATUS[phase][lang];
export const statusTone = (phase: EventPhase) => STATUS[phase].tone;

/** A date is "to be announced" until the organisers set one (the old pages said exactly this). */
export function eventDate(e: PublicEventCard, lang: Lang): string {
  if (!e.startDate) return lang === 'en' ? 'To be announced soon' : 'قريبًا سيعلن عنه';
  return formatDateRange(e.startDate, e.endDate, lang);
}

export function eventDuration(e: PublicEventCard, lang: Lang): string {
  const en = lang === 'en';
  if (e.startDate && e.endDate && e.endDate > e.startDate) {
    const days =
      Math.round(
        (Date.parse(`${e.endDate}T00:00:00Z`) - Date.parse(`${e.startDate}T00:00:00Z`)) /
          86_400_000,
      ) + 1;
    return en ? `${days} days` : days === 2 ? 'يومان' : `${days} ${days <= 10 ? 'أيام' : 'يومًا'}`;
  }
  if (e.startTime && e.endTime) {
    const minutes = toMinutes(e.endTime) - toMinutes(e.startTime);
    if (minutes > 0) {
      const h = minutes / 60;
      const text = Number.isInteger(h) ? String(h) : h.toFixed(1);
      return en ? `${text} ${h === 1 ? 'hour' : 'hours'}` : h === 1 ? 'ساعة' : `${text} ساعات`;
    }
  }
  return en ? 'Not specified' : 'غير محدد';
}

function toMinutes(t: string) {
  const [h = '0', m = '0'] = t.split(':');
  return Number(h) * 60 + Number(m);
}
