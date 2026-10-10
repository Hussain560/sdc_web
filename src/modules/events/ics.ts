/** iCalendar (RFC 5545) for one event: one VEVENT per day, Asia/Riyadh wall-clock times, no personal data. */

export type IcsDay = {
  date: string;
  startsAt: string | null;
  endsAt: string | null;
  place: string | null;
};

export type IcsEvent = {
  slug: string;
  title: string;
  description: string | null;
  url: string;
  days: IcsDay[];
  /** Fallback times when a day has none. */
  startTime: string | null;
  endTime: string | null;
  place: string;
};

/** Escapes TEXT values: backslash, semicolon, comma and newlines. */
export const icsText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a content line at 75 octets (continuation lines start with a space). */
export function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length === 0 ? 75 : 74)) {
      out.push(cur);
      cur = '';
      size = 0;
    }
    cur += ch;
    size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const compact = (date: string, time: string | null, fallback: string) =>
  `${date.replace(/-/g, '')}T${(time ?? fallback).slice(0, 8).replace(/:/g, '').padEnd(6, '0')}`;

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

export function buildIcs(e: IcsEvent, now: Date): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saudi Developer Community//Events//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Riyadh',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:+03',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
  e.days.forEach((d, i) => {
    const start = compact(d.date, d.startsAt ?? e.startTime, '090000');
    const end = compact(d.date, d.endsAt ?? e.endTime, '170000');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.slug}-${d.date}@sdc`,
      `DTSTAMP:${stamp(now)}Z`,
      `DTSTART;TZID=Asia/Riyadh:${start}`,
      `DTEND;TZID=Asia/Riyadh:${end}`,
      `SUMMARY:${icsText(e.days.length > 1 ? `${e.title} (${i + 1}/${e.days.length})` : e.title)}`,
      `LOCATION:${icsText(d.place ?? e.place)}`,
      `URL:${e.url}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${icsText(e.description.slice(0, 500))}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
