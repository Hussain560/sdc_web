import {
  DEFAULT_DISPLAY_CONFIG,
  DETAIL_KEYS,
  emptyDetails,
  type DetailKey,
  type EventFormValues,
  type FormDetails,
  type FormPresenter,
  type PresenterRole,
} from './types';

/** Riyadh is UTC+3 all year: a datetime-local value is converted with that offset (and back). */
export const riyadhLocalToIso = (local: string): string | null =>
  local ? new Date(`${local}:00+03:00`).toISOString() : null;

export const isoToRiyadhLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

const hhmm = (v: string | null | undefined) => (v ? v.slice(0, 5) : '');
const trimmed = (v: string) => v.trim();

/** Wizard values → the payload `save_event` expects (snake_case, only meaningful values). */
export function toPayload(v: EventFormValues): Record<string, unknown> {
  const details: Record<string, { ar: string[]; en: string[] }> = {};
  for (const k of DETAIL_KEYS) {
    details[k] = {
      ar: v.details[k].ar.map(trimmed).filter(Boolean),
      en: v.details[k].en.map(trimmed).filter(Boolean),
    };
  }
  return {
    committee_id: v.committeeId,
    type: v.type,
    slug: v.slug || undefined,
    title_ar: trimmed(v.titleAr),
    title_en: trimmed(v.titleEn),
    summary_ar: trimmed(v.summaryAr),
    summary_en: trimmed(v.summaryEn),
    description_ar: trimmed(v.descriptionAr),
    description_en: trimmed(v.descriptionEn),
    schedule_type: v.scheduleType,
    start_date: v.scheduleType === 'specific_dates' ? '' : v.startDate,
    end_date:
      v.scheduleType === 'consecutive_range'
        ? v.endDate
        : v.scheduleType === 'single_day'
          ? v.startDate
          : '',
    dates: v.scheduleType === 'specific_dates' ? [...new Set(v.dates)].sort() : undefined,
    start_time: v.startTime,
    end_time: v.endTime,
    location_mode: v.locationMode,
    location_ar: trimmed(v.locationAr),
    location_en: trimmed(v.locationEn),
    map_url: trimmed(v.mapUrl),
    meeting_url: trimmed(v.meetingUrl),
    meeting_notes: trimmed(v.meetingNotes),
    group_link: trimmed(v.groupLink),
    seats: v.seats === '' ? '' : v.seats,
    registration_start_at: riyadhLocalToIso(v.registrationStartAt) ?? '',
    registration_end_at: riyadhLocalToIso(v.registrationEndAt) ?? '',
    requires_approval: v.requiresApproval,
    waitlist_enabled: v.waitlistEnabled && v.seats !== '',
    audience: v.audience,
    goals: {
      ar: v.goals.map((g) => trimmed(g.ar)).filter(Boolean),
      en: v.goals.map((g) => trimmed(g.en)).filter(Boolean),
    },
    faq: v.faq
      .filter((f) => trimmed(f.qAr) || trimmed(f.aAr))
      .map((f) => ({
        q_ar: trimmed(f.qAr),
        q_en: trimmed(f.qEn),
        a_ar: trimmed(f.aAr),
        a_en: trimmed(f.aEn),
      })),
    details,
    display_config: v.displayConfig,
    cover_image_path: v.coverImagePath,
    awards_ar: trimmed(v.awardsAr),
    awards_en: trimmed(v.awardsEn),
    certificate_available: v.certificateAvailable,
    contact_email: trimmed(v.contactEmail),
    contact_phone: trimmed(v.contactPhone),
    presenters: v.presenters.map((p) => ({
      profile_id: p.profileId || '',
      guest_name_ar: p.profileId ? '' : trimmed(p.guestNameAr),
      guest_name_en: p.profileId ? '' : trimmed(p.guestNameEn),
      guest_title_ar: trimmed(p.guestTitleAr),
      guest_title_en: trimmed(p.guestTitleEn),
      guest_link: trimmed(p.guestLink),
      role: p.role,
    })),
  };
}

type Json = Record<string, unknown>;

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** A row read for editing (events + private details + dates + presenters) → wizard values. */
export function fromRow(
  e: Json,
  priv: Json | null,
  dates: string[],
  presenters: Array<Json & { profileName?: string }>,
): EventFormValues {
  const goalsAr = arr((e.goals as Json | undefined)?.ar);
  const goalsEn = arr((e.goals as Json | undefined)?.en);
  const goals = Array.from({ length: Math.max(goalsAr.length, goalsEn.length, 1) }, (_, i) => ({
    ar: goalsAr[i] ?? '',
    en: goalsEn[i] ?? '',
  }));
  const details: FormDetails = emptyDetails();
  const rawDetails = (e.details as Json | undefined) ?? {};
  for (const k of DETAIL_KEYS as readonly DetailKey[]) {
    const d = (rawDetails[k] as Json | undefined) ?? {};
    details[k] = { ar: arr(d.ar), en: arr(d.en) };
  }
  const faq = (Array.isArray(e.faq) ? (e.faq as Json[]) : []).map((f) => ({
    qAr: String(f.q_ar ?? ''),
    qEn: String(f.q_en ?? ''),
    aAr: String(f.a_ar ?? ''),
    aEn: String(f.a_en ?? ''),
  }));
  const text = (v: unknown) => (v == null ? '' : String(v));

  return {
    committeeId: text(e.committee_id),
    type: e.type as EventFormValues['type'],
    titleAr: text(e.title_ar),
    titleEn: text(e.title_en),
    slug: text(e.slug),
    summaryAr: text(e.summary_ar),
    summaryEn: text(e.summary_en),
    descriptionAr: text(e.description_ar),
    descriptionEn: text(e.description_en),
    scheduleType: e.schedule_type as EventFormValues['scheduleType'],
    startDate: text(e.start_date),
    endDate: text(e.end_date),
    dates,
    startTime: hhmm(e.start_time as string | null),
    endTime: hhmm(e.end_time as string | null),
    locationMode: e.location_mode as EventFormValues['locationMode'],
    locationAr: text(e.location_ar),
    locationEn: text(e.location_en),
    mapUrl: text(e.map_url),
    meetingUrl: text(priv?.meeting_url),
    meetingNotes: text(priv?.meeting_notes),
    groupLink: text(priv?.group_link),
    seats: e.seats == null ? '' : String(e.seats),
    registrationStartAt: isoToRiyadhLocal(e.registration_start_at as string | null),
    registrationEndAt: isoToRiyadhLocal(e.registration_end_at as string | null),
    requiresApproval: Boolean(e.requires_approval),
    waitlistEnabled: Boolean(e.waitlist_enabled),
    audience: (e.audience as EventFormValues['audience']) ?? 'public',
    coverImagePath: text(e.cover_image_path),
    goals,
    faq,
    presenters: presenters.map((p): FormPresenter => ({
      profileId: text(p.profile_id),
      profileName: text(p.profileName),
      guestNameAr: text(p.guest_name_ar),
      guestNameEn: text(p.guest_name_en),
      guestTitleAr: text(p.guest_title_ar),
      guestTitleEn: text(p.guest_title_en),
      guestLink: text(p.guest_link),
      role: (p.role as PresenterRole) ?? 'presenter',
    })),
    details,
    certificateAvailable: Boolean(e.certificate_available),
    awardsAr: text(e.awards_ar),
    awardsEn: text(e.awards_en),
    contactEmail: text(e.contact_email),
    contactPhone: text(e.contact_phone),
    displayConfig: { ...DEFAULT_DISPLAY_CONFIG, ...((e.display_config as Json | undefined) ?? {}) },
    submissionNote: '',
    confirmed: false,
  };
}
