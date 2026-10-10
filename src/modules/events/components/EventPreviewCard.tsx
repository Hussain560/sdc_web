import { CalendarDays, Laptop, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatDateRange, formatTimeRange } from '@/lib/format';
import type { Lang } from '@/modules/auth/messages';
import { LOCATION_LABEL, PHASE_LABEL, TYPE_LABEL, type EventFormValues } from '../types';

/**
 * Live preview of the event card while the wizard is edited. Public pages (Sprint 06) render the same data with
 * the existing public CSS; this card shares its content rules (title in the active language, date, place, seats).
 */
export function EventPreviewCard({
  values,
  lang,
  coverUrl,
}: {
  values: EventFormValues;
  lang: Lang;
  coverUrl: string | null;
}) {
  const ar = lang === 'ar';
  const title = (ar ? values.titleAr : values.titleEn) || values.titleAr || values.titleEn;
  const start =
    values.scheduleType === 'specific_dates' ? (values.dates[0] ?? null) : values.startDate || null;
  const end =
    values.scheduleType === 'specific_dates'
      ? (values.dates.at(-1) ?? null)
      : values.scheduleType === 'consecutive_range'
        ? values.endDate || null
        : null;
  const place =
    values.locationMode === 'online'
      ? LOCATION_LABEL.online[lang]
      : (ar ? values.locationAr : values.locationEn || values.locationAr) ||
        LOCATION_LABEL[values.locationMode][lang];
  const time = formatTimeRange(values.startTime, values.endTime);

  return (
    <article
      className="overflow-hidden rounded-shape-xl border border-line bg-surface"
      aria-label={ar ? 'معاينة البطاقة' : 'Card preview'}
    >
      <div className="relative aspect-video bg-surface-raised">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted">
            {ar ? 'لا توجد صورة غلاف' : 'No cover image'}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{TYPE_LABEL[values.type][lang]}</Badge>
          <Badge tone={PHASE_LABEL.announced.tone}>{PHASE_LABEL.announced.label[lang]}</Badge>
        </div>
        <h3 className="text-lg font-bold leading-snug">
          {title || <span className="text-muted">{ar ? 'عنوان الفعالية' : 'Event title'}</span>}
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-muted">
          <li className="flex items-center gap-2">
            <CalendarDays size={16} aria-hidden="true" />
            <span>
              {formatDateRange(start, end, lang)}
              {time && ` · ${time}`}
            </span>
          </li>
          <li className="flex items-center gap-2">
            {values.locationMode === 'online' ? (
              <Laptop size={16} aria-hidden="true" />
            ) : (
              <MapPin size={16} aria-hidden="true" />
            )}
            <span>
              {place}
              {values.seats && ` · ${values.seats} ${ar ? 'مقعدًا' : 'seats'}`}
            </span>
          </li>
        </ul>
      </div>
    </article>
  );
}
