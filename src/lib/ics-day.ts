import { icsText, fold } from '@/modules/events/ics';

/** A one-day, all-day calendar entry (the decision date). No personal data in it. */
export function buildDayIcs(input: {
  uid: string;
  date: string;
  title: string;
  description?: string;
  now?: Date;
}): string {
  const stamp = (input.now ?? new Date())
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const day = input.date.replace(/-/g, '');
  const next = new Date(`${input.date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replace(/-/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saudi Developer Community//Membership//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@sdc`,
    `DTSTAMP:${stamp}Z`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsText(input.title)}`,
    ...(input.description ? [`DESCRIPTION:${icsText(input.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
