import { z } from 'zod';
import { ROLE_KEYS } from './types';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const tags = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3),
  );

export const assignRoleSchema = z.object({
  userId: z.uuid(),
  roleKey: z.enum(ROLE_KEYS),
  committeeId: z
    .uuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  startsAt: dateOnly,
  endsAt: dateOnly,
  titleAr: text(100),
  titleEn: text(100),
  bioAr: text(300),
  bioEn: text(300),
  tagsAr: tags,
  tagsEn: tags,
});

export const endAssignmentSchema = z.object({
  assignmentId: z.uuid(),
  reason: z.string().trim().min(1).max(500),
  endsAt: dateOnly,
});

export const handoverSchema = z.object({
  committeeId: z.uuid(),
  newHeadUserId: z.uuid(),
  handoverAt: dateOnly,
});

/** A date picked in the UI is midnight in Saudi Arabia (UTC+3, no daylight saving). */
export const riyadhMidnight = (date: string) => new Date(`${date}T00:00:00+03:00`).toISOString();
