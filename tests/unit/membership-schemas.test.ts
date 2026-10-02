import { describe, expect, it } from 'vitest';
import {
  OTHER,
  fromApplicationRow,
  isoToRiyadh,
  riyadhToIso,
  toApplicationPayload,
  validateApplication,
  validateApplicationStep,
  validateCycle,
} from '@/modules/membership/schemas';
import {
  emptyApplication,
  type CycleFormValues,
  type CycleQuestion,
} from '@/modules/membership/types';

const questions: CycleQuestion[] = [
  { key: 'why', type: 'long_text', required: true, label_ar: 'لماذا؟' },
  { key: 'tools', type: 'multi_choice', required: false, label_ar: 'أدوات', options: ['a', 'b'] },
];

const valid = () => ({
  ...emptyApplication(),
  fullNameAr: 'متقدم اختبار',
  academicStatus: 'student' as const,
  universityId: '1',
  majorId: '2',
  trackId: '3',
  answers: { why: 'لأنني أحب المجتمع' },
  consent: true,
});

describe('application steps', () => {
  it('accepts a complete application', () => {
    expect(validateApplication(valid(), questions, 'en')).toEqual({});
  });

  it('personal: needs an Arabic name and a plausible phone', () => {
    const v = { ...valid(), fullNameAr: 'ab', phone: '12' };
    const e = validateApplicationStep('personal', v, questions, 'en');
    expect(Object.keys(e)).toEqual(['fullNameAr', 'phone']);
    expect(
      validateApplicationStep('personal', { ...valid(), phone: '+966501234567' }, questions, 'en'),
    ).toEqual({});
  });

  it('academic: "other" needs the typed value', () => {
    const base = { ...valid(), universityId: OTHER, majorId: OTHER };
    const e = validateApplicationStep('academic', base, questions, 'ar');
    expect(Object.keys(e)).toEqual(['universityId', 'majorId']);
    const ok = validateApplicationStep(
      'academic',
      { ...base, otherUniversity: 'جامعة ما', otherMajor: 'تخصص ما' },
      questions,
      'ar',
    );
    expect(ok).toEqual({});
  });

  it('links must be https', () => {
    const e = validateApplicationStep(
      'links',
      { ...valid(), githubUrl: 'http://x.test', xUrl: 'https://x.com/a' },
      questions,
      'en',
    );
    expect(Object.keys(e)).toEqual(['githubUrl']);
  });

  it('required cycle questions are enforced, optional ones are not', () => {
    const e = validateApplicationStep('questions', { ...valid(), answers: {} }, questions, 'en');
    expect(Object.keys(e)).toEqual(['q:why']);
  });

  it('consent is required to submit', () => {
    expect(
      validateApplicationStep('review', { ...valid(), consent: false }, questions, 'ar').consent,
    ).toMatch(/الخصوصية/);
  });
});

describe('payload mapping', () => {
  it('moves "other" text into answers and clears the ids', () => {
    const p = toApplicationPayload(
      {
        ...valid(),
        universityId: OTHER,
        otherUniversity: ' جامعة ما ',
        majorId: OTHER,
        otherMajor: 'تخصص',
        subMajorId: '9',
      },
      'v1',
    );
    expect(p.university_id).toBe('');
    expect(p.major_id).toBe('');
    expect(p.sub_major_id).toBe('');
    expect(p.answers).toMatchObject({
      other_university: 'جامعة ما',
      other_major: 'تخصص',
      why: 'لأنني أحب المجتمع',
    });
    expect(p.consent_version).toBe('v1');
  });

  it('round-trips through a saved row', () => {
    const p = toApplicationPayload(
      { ...valid(), universityId: OTHER, otherUniversity: 'جامعة ما' },
      'v1',
    );
    const back = fromApplicationRow({ ...p, university_id: null });
    expect(back.universityId).toBe(OTHER);
    expect(back.otherUniversity).toBe('جامعة ما');
    expect(back.answers).toEqual({ why: 'لأنني أحب المجتمع' });
  });
});

describe('cycle form', () => {
  const cycle = (over: Partial<CycleFormValues> = {}): CycleFormValues => ({
    nameAr: 'استقبال 2027',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    opensAt: '2027-02-01T09:00',
    closesAt: '2027-02-10T23:59',
    reviewEndsAt: '',
    capacity: '',
    questions: [],
    ...over,
  });

  it('accepts a valid window and rejects a reversed one', () => {
    expect(validateCycle(cycle(), 'en')).toEqual({});
    expect(validateCycle(cycle({ closesAt: '2027-01-01T00:00' }), 'en').closesAt).toBeTruthy();
    expect(
      validateCycle(cycle({ reviewEndsAt: '2027-02-05T00:00' }), 'en').reviewEndsAt,
    ).toBeTruthy();
    expect(validateCycle(cycle({ capacity: '0' }), 'en').capacity).toBeTruthy();
  });

  it('checks the question builder', () => {
    const q = (patch: Partial<CycleQuestion>): CycleQuestion => ({
      key: 'q1',
      type: 'text',
      required: false,
      label_ar: 'سؤال',
      ...patch,
    });
    expect(validateCycle(cycle({ questions: [q({})] }), 'en')).toEqual({});
    expect(
      validateCycle(cycle({ questions: [q({ key: 'Bad Key' })] }), 'en').questions,
    ).toBeTruthy();
    expect(
      validateCycle(
        cycle({ questions: [q({ type: 'single_choice', options: ['only one'] })] }),
        'en',
      ).questions,
    ).toBeTruthy();
    expect(
      validateCycle(
        cycle({ questions: Array.from({ length: 11 }, (_, i) => q({ key: `q${i}` })) }),
        'en',
      ).questions,
    ).toBeTruthy();
  });

  it('converts Riyadh wall-clock time to the right instant and back', () => {
    expect(riyadhToIso('2027-02-01T09:00')).toBe('2027-02-01T06:00:00.000Z');
    expect(isoToRiyadh('2027-02-01T06:00:00.000Z')).toBe('2027-02-01T09:00');
    expect(riyadhToIso('')).toBe('');
  });
});
