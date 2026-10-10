import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeoutError, withMinimumDuration } from '@/lib/min-duration';

// Sprint 15 timing tests T1-T3 (docs/99-project-management/sprints/sprint-15-home-and-event-page/plan.md).
const later = <T>(ms: number, value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
const laterReject = (ms: number, error: Error) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(error), ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function track<T>(p: Promise<T>) {
  const state = { settled: false, value: undefined as T | undefined, error: undefined as unknown };
  p.then(
    (v) => {
      state.settled = true;
      state.value = v;
    },
    (e: unknown) => {
      state.settled = true;
      state.error = e;
    },
  );
  return state;
}

describe('withMinimumDuration', () => {
  it('T1: a fast server still waits for the 1500 ms floor', async () => {
    const s = track(withMinimumDuration(later(200, 'ok')));
    await vi.advanceTimersByTimeAsync(1499);
    expect(s.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.settled).toBe(true);
    expect(s.value).toBe('ok');
  });

  it('T2: a slow server settles when it answers, with no extra wait', async () => {
    const s = track(withMinimumDuration(later(2300, 'slow')));
    await vi.advanceTimersByTimeAsync(2299);
    expect(s.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.settled).toBe(true);
    expect(s.value).toBe('slow');
  });

  it('T3: errors wait too', async () => {
    const s = track(withMinimumDuration(laterReject(100, new Error('boom'))));
    await vi.advanceTimersByTimeAsync(1499);
    expect(s.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.settled).toBe(true);
    expect((s.error as Error).message).toBe('boom');
  });

  it('an answer exactly at the floor settles at the floor', async () => {
    const s = track(withMinimumDuration(later(1500, 1)));
    await vi.advanceTimersByTimeAsync(1500);
    expect(s.value).toBe(1);
  });

  it('no answer within the timeout rejects with TimeoutError at 15 s', async () => {
    const s = track(withMinimumDuration(new Promise<string>(() => {})));
    await vi.advanceTimersByTimeAsync(14_999);
    expect(s.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.error).toBeInstanceOf(TimeoutError);
  });

  it('a late answer after the timeout is ignored', async () => {
    const s = track(withMinimumDuration(later(20_000, 'late')));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(s.error).toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(6000);
    expect(s.value).toBeUndefined();
  });

  it('custom floor and timeout are honoured', async () => {
    const s = track(withMinimumDuration(later(10, 'x'), { minMs: 300, timeoutMs: 1000 }));
    await vi.advanceTimersByTimeAsync(299);
    expect(s.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(s.value).toBe('x');
  });
});
