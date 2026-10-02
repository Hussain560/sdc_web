import { describe, expect, it } from 'vitest';
import { fromRow, isoToRiyadhLocal, riyadhLocalToIso, toPayload } from '@/modules/events/mapping';
import { validateAll, validateDraft, validateStep } from '@/modules/events/schemas';
import { emptyForm, type EventFormValues } from '@/modules/events/types';

const COMMITTEE = '11111111-1111-4111-8111-111111111111';

/** A fully valid event (steps 1–4). Each test breaks one rule. */
const valid = (patch: Partial<EventFormValues> = {}): EventFormValues => ({
  ...emptyForm(COMMITTEE),
  titleAr: 'ورشة Next.js والذكاء الاصطناعي',
  titleEn: 'Next.js & AI Workshop',
  startDate: '2026-12-10',
  startTime: '18:00',
  endTime: '20:00',
  locationMode: 'online',
  groupLink: 'https://chat.whatsapp.com/abc',
  goals: [{ ar: 'بناء تطبيق ويب كامل', en: 'Build a full web app' }],
  confirmed: true,
  ...patch,
});

const errorsOf = (step: 1 | 2 | 3 | 4, v: EventFormValues, lang: 'ar' | 'en' = 'en') => {
  const r = validateStep(step, v, lang);
  return r.ok ? {} : r.errors;
};

describe('step 1 — identity', () => {
  it('accepts a valid identity', () => expect(validateStep(1, valid(), 'en').ok).toBe(true));

  it.each(['', 'ab'])('rejects the Arabic title %j (3–200)', (titleAr) => {
    expect(errorsOf(1, valid({ titleAr }))).toHaveProperty('titleAr');
  });

  it('rejects a title over 200 characters', () => {
    expect(errorsOf(1, valid({ titleAr: 'ا'.repeat(201) }))).toHaveProperty('titleAr');
  });

  it('requires a committee and validates the slug when given', () => {
    expect(errorsOf(1, valid({ committeeId: '' }))).toHaveProperty('committeeId');
    expect(errorsOf(1, valid({ slug: 'Bad Slug' }))).toHaveProperty('slug');
    expect(errorsOf(1, valid({ slug: 'good-slug-1' }))).toEqual({});
  });

  it('speaks Arabic for the Arabic locale', () => {
    expect(errorsOf(1, valid({ titleAr: '' }), 'ar').titleAr).toMatch(/العنوان/);
  });
});

describe('step 2 — logistics (KFUCS cases)', () => {
  it('accepts a valid online single-day event', () =>
    expect(validateStep(2, valid(), 'en').ok).toBe(true));

  it('single day needs a start date', () => {
    expect(errorsOf(2, valid({ startDate: '' }))).toHaveProperty('startDate');
  });

  it('a range needs an end date that is not before the start', () => {
    const range = { scheduleType: 'consecutive_range' as const };
    expect(errorsOf(2, valid({ ...range, endDate: '' }))).toHaveProperty('endDate');
    expect(errorsOf(2, valid({ ...range, endDate: '2026-12-09' }))).toHaveProperty('endDate');
    expect(errorsOf(2, valid({ ...range, endDate: '2026-12-12' }))).toEqual({});
  });

  it('specific dates need at least one, without duplicates', () => {
    const specific = { scheduleType: 'specific_dates' as const, startDate: '' };
    expect(errorsOf(2, valid({ ...specific, dates: [] }))).toHaveProperty('dates');
    expect(errorsOf(2, valid({ ...specific, dates: ['2026-12-10', '2026-12-10'] }))).toHaveProperty(
      'dates',
    );
    expect(errorsOf(2, valid({ ...specific, dates: ['2026-12-10', '2026-12-12'] }))).toEqual({});
  });

  it('same-day events need end time after start time', () => {
    expect(errorsOf(2, valid({ startTime: '20:00', endTime: '18:00' }))).toHaveProperty('endTime');
    expect(errorsOf(2, valid({ startTime: '20:00', endTime: '20:00' }))).toHaveProperty('endTime');
  });

  it('multi-day ranges do not compare the times', () => {
    expect(
      errorsOf(
        2,
        valid({
          scheduleType: 'consecutive_range',
          endDate: '2026-12-12',
          startTime: '20:00',
          endTime: '09:00',
        }),
      ),
    ).toEqual({});
  });

  it('in-person and hybrid events need a location; online does not', () => {
    expect(errorsOf(2, valid({ locationMode: 'in_person', locationAr: '' }))).toHaveProperty(
      'locationAr',
    );
    expect(errorsOf(2, valid({ locationMode: 'hybrid', locationAr: '   ' }))).toHaveProperty(
      'locationAr',
    );
    expect(errorsOf(2, valid({ locationMode: 'in_person', locationAr: 'الرياض' }))).toEqual({});
    expect(errorsOf(2, valid({ locationMode: 'online', locationAr: '' }))).toEqual({});
  });

  it('the group link is required and must be https (KFUCS 2026-09-16)', () => {
    expect(errorsOf(2, valid({ groupLink: '' }))).toHaveProperty('groupLink');
    expect(errorsOf(2, valid({ groupLink: 'http://x.example' }))).toHaveProperty('groupLink');
    expect(errorsOf(2, valid({ groupLink: 'chat.example' }))).toHaveProperty('groupLink');
  });

  it('the meeting link is optional but must be a valid https URL when present', () => {
    expect(errorsOf(2, valid({ meetingUrl: '' }))).toEqual({});
    expect(errorsOf(2, valid({ meetingUrl: 'not a url' }))).toHaveProperty('meetingUrl');
    expect(errorsOf(2, valid({ meetingUrl: 'https://meet.google.com/abc-defg' }))).toEqual({});
  });

  it('seats are a positive integer or unlimited', () => {
    expect(errorsOf(2, valid({ seats: '' }))).toEqual({});
    expect(errorsOf(2, valid({ seats: '60' }))).toEqual({});
    for (const seats of ['0', '-5', '1.5', 'abc'])
      expect(errorsOf(2, valid({ seats }))).toHaveProperty('seats');
  });

  it('the registration deadline may be AFTER the event starts (reopen) but not before it opens', () => {
    expect(
      errorsOf(
        2,
        valid({ registrationStartAt: '2026-12-01T00:00', registrationEndAt: '2026-12-11T23:59' }),
      ),
    ).toEqual({});
    expect(
      errorsOf(
        2,
        valid({ registrationStartAt: '2026-12-05T00:00', registrationEndAt: '2026-12-01T00:00' }),
      ),
    ).toHaveProperty('registrationEndAt');
  });

  it('rejects malformed times', () => {
    expect(errorsOf(2, valid({ startTime: '25:00' }))).toHaveProperty('startTime');
  });
});

describe('step 3 — content', () => {
  it('needs at least one Arabic goal (Arabic-first), at most 15', () => {
    expect(errorsOf(3, valid({ goals: [{ ar: '', en: 'Only English' }] }))).toHaveProperty('goals');
    expect(errorsOf(3, valid({ goals: [] }))).toHaveProperty('goals');
    expect(
      errorsOf(3, valid({ goals: Array.from({ length: 16 }, () => ({ ar: 'هدف', en: '' })) })),
    ).toHaveProperty('goals');
    expect(errorsOf(3, valid({ goals: [{ ar: 'هدف', en: '' }] }))).toEqual({});
  });

  it('every FAQ item needs an Arabic question and answer; at most 15', () => {
    expect(
      errorsOf(3, valid({ faq: [{ qAr: 'سؤال', qEn: '', aAr: '', aEn: '' }] })),
    ).toHaveProperty('faq');
    expect(errorsOf(3, valid({ faq: [{ qAr: 'سؤال', qEn: '', aAr: 'جواب', aEn: '' }] }))).toEqual(
      {},
    );
    const many = Array.from({ length: 16 }, () => ({ qAr: 'س', qEn: '', aAr: 'ج', aEn: '' }));
    expect(errorsOf(3, valid({ faq: many }))).toHaveProperty('faq');
  });

  it('presenters: an account or an Arabic guest name; at most 10', () => {
    const guest = (name: string) => ({
      profileId: '',
      profileName: '',
      guestNameAr: name,
      guestNameEn: '',
      guestTitleAr: '',
      guestTitleEn: '',
      guestLink: '',
      role: 'presenter' as const,
    });
    expect(errorsOf(3, valid({ presenters: [guest('')] }))).toHaveProperty('presenters');
    expect(errorsOf(3, valid({ presenters: [guest('م. أحمد')] }))).toEqual({});
    expect(
      errorsOf(3, valid({ presenters: Array.from({ length: 11 }, () => guest('x')) })),
    ).toHaveProperty('presenters');
  });

  it('detail items: at most 20 per list, 300 characters each', () => {
    const details = valid().details;
    details.benefits.ar = Array.from({ length: 21 }, () => 'x');
    expect(errorsOf(3, valid({ details }))).toBeTruthy();
  });

  it('contact e-mail and phone formats', () => {
    expect(errorsOf(3, valid({ contactEmail: 'bad' }))).toHaveProperty('contactEmail');
    expect(errorsOf(3, valid({ contactPhone: '123' }))).toHaveProperty('contactPhone');
    expect(
      errorsOf(3, valid({ contactEmail: 'sdc@example.test', contactPhone: '+966512345678' })),
    ).toEqual({});
    expect(errorsOf(3, valid({ contactPhone: '0512345678' }))).toEqual({});
  });
});

describe('step 4, whole form and drafts', () => {
  it('requires the confirmation to submit', () => {
    expect(errorsOf(4, valid({ confirmed: false }))).toHaveProperty('confirmed');
    expect(errorsOf(4, valid())).toEqual({});
  });

  it('validateAll reports the first failing step', () => {
    const r = validateAll(valid({ groupLink: '' }), 'en');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.step).toBe(2);
    expect(validateAll(valid(), 'en').ok).toBe(true);
  });

  it('a draft only needs committee, type and an Arabic title', () => {
    expect(validateDraft(emptyForm(COMMITTEE), 'en').ok).toBe(false);
    expect(validateDraft({ ...emptyForm(COMMITTEE), titleAr: 'عنوان أولي' }, 'en').ok).toBe(true);
  });
});

describe('payload mapping', () => {
  it('converts Riyadh local time to UTC and back (UTC+3, no daylight saving)', () => {
    expect(riyadhLocalToIso('2026-11-09T23:59')).toBe('2026-11-09T20:59:00.000Z');
    expect(isoToRiyadhLocal('2026-11-09T20:59:00.000Z')).toBe('2026-11-09T23:59');
    expect(riyadhLocalToIso('')).toBeNull();
  });

  it('single day sends start and end; specific dates send a sorted unique list and no start', () => {
    const single = toPayload(valid());
    expect(single).toMatchObject({
      start_date: '2026-12-10',
      end_date: '2026-12-10',
      schedule_type: 'single_day',
    });
    const specific = toPayload(
      valid({
        scheduleType: 'specific_dates',
        startDate: '2026-12-10',
        dates: ['2026-12-12', '2026-12-10', '2026-12-12'],
      }),
    );
    expect(specific.dates).toEqual(['2026-12-10', '2026-12-12']);
    expect(specific.start_date).toBe('');
  });

  it('drops empty goals/FAQ/detail items and the waitlist when seats are unlimited', () => {
    const p = toPayload(
      valid({
        goals: [
          { ar: 'هدف', en: '' },
          { ar: '  ', en: '' },
        ],
        waitlistEnabled: true,
        seats: '',
      }),
    );
    expect(p.goals).toEqual({ ar: ['هدف'], en: [] });
    expect(p.waitlist_enabled).toBe(false);
  });

  it('round-trips a database row back into the wizard', () => {
    const payload = toPayload(
      valid({
        seats: '60',
        registrationEndAt: '2026-12-09T23:59',
        faq: [{ qAr: 'س', qEn: 'Q', aAr: 'ج', aEn: 'A' }],
      }),
    ) as Record<string, unknown>;
    const row = {
      ...payload,
      committee_id: COMMITTEE,
      seats: 60,
      registration_end_at: riyadhLocalToIso('2026-12-09T23:59'),
      start_time: '18:00:00',
      end_time: '20:00:00',
      display_config: payload.display_config,
    };
    const form = fromRow(
      row,
      { group_link: 'https://chat.whatsapp.com/abc', meeting_url: null, meeting_notes: null },
      [],
      [],
    );
    expect(form).toMatchObject({
      titleAr: 'ورشة Next.js والذكاء الاصطناعي',
      seats: '60',
      registrationEndAt: '2026-12-09T23:59',
      startTime: '18:00',
      groupLink: 'https://chat.whatsapp.com/abc',
    });
    expect(form.faq).toEqual([{ qAr: 'س', qEn: 'Q', aAr: 'ج', aEn: 'A' }]);
    expect(form.goals[0]).toEqual({ ar: 'بناء تطبيق ويب كامل', en: 'Build a full web app' });
  });
});
