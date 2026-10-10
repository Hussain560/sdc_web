/** Thrown by `withMinimumDuration` when the work does not answer within `timeoutMs`. */
export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`No answer within ${timeoutMs} ms`);
    this.name = 'TimeoutError';
  }
}

export const MIN_FEEDBACK_MS = 1500;
export const FEEDBACK_TIMEOUT_MS = 15_000;

/**
 * Settles at `max(server answer, start + minMs)` for every outcome, success or failure (event page §5.2).
 * People trust a result they could see being worked on, and a refusal that flashes by in 80 ms looks like a bug.
 * If the work has not answered after `timeoutMs`, rejects with `TimeoutError` (the caller shows "try again").
 */
export function withMinimumDuration<T>(
  work: Promise<T>,
  { minMs = MIN_FEEDBACK_MS, timeoutMs = FEEDBACK_TIMEOUT_MS } = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let outcome: { ok: true; value: T } | { ok: false; error: unknown } | null = null;
    let floorPassed = false;
    let done = false;

    const finish = () => {
      if (done || !outcome || !floorPassed) return;
      done = true;
      clearTimeout(timeout);
      if (outcome.ok) resolve(outcome.value);
      else reject(outcome.error);
    };

    const floor = setTimeout(() => {
      floorPassed = true;
      finish();
    }, minMs);

    const timeout = setTimeout(
      () => {
        if (done) return;
        done = true;
        clearTimeout(floor);
        reject(new TimeoutError(timeoutMs));
      },
      Math.max(timeoutMs, minMs),
    );

    work.then(
      (value) => {
        outcome = { ok: true, value };
        finish();
      },
      (error: unknown) => {
        outcome = { ok: false, error };
        finish();
      },
    );
  });
}
