/** Links that put one event in a person's calendar (no personal data in any of them). */

export type CalendarEventInfo = {
  title: string;
  /** yyyy-mm-dd, Asia/Riyadh. */
  startDate: string;
  endDate: string | null;
  /** "HH:MM[:SS]" wall-clock times, used when the event is a single day. */
  startTime: string | null;
  endTime: string | null;
  place: string | null;
  description?: string | null;
  /** The event page. */
  url: string;
};

const compactDate = (d: string) => d.replace(/-/g, '');
const compactTime = (t: string) => `${t.slice(0, 5).replace(':', '')}00`;

/** The day after a yyyy-mm-dd date (an all-day event's end is exclusive in Google Calendar). */
function nextDay(d: string): string {
  const date = new Date(`${d}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Google Calendar "add event" link. A single day with times is a timed event in Saudi time; a multi-day event, or
 * one without times, is an all-day block over its dates (the downloadable .ics keeps the per-day times).
 */
export function googleCalendarUrl(e: CalendarEventInfo): string {
  const single = !e.endDate || e.endDate === e.startDate;
  const timed = single && !!e.startTime && !!e.endTime;
  const dates = timed
    ? `${compactDate(e.startDate)}T${compactTime(e.startTime!)}/${compactDate(e.startDate)}T${compactTime(e.endTime!)}`
    : `${compactDate(e.startDate)}/${compactDate(nextDay(e.endDate ?? e.startDate))}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates,
    details: [e.description, e.url].filter(Boolean).join('\n\n'),
    location: e.place ?? '',
  });
  if (timed) params.set('ctz', 'Asia/Riyadh');
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Apple Calendar (and Outlook, and anything else) opens the .ics file. */
export const icsUrl = (slug: string, lang: 'ar' | 'en') =>
  `${lang === 'en' ? '/en' : ''}/events/${slug}/calendar.ics`;
