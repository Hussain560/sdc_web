'use client';

import { CircleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface ErrorSummaryItem {
  /** The id of the invalid control, so the link can focus it. */
  fieldId: string;
  message: string;
}

/**
 * Shown at the top of a form after a failed submit (components §5.1). Takes focus when it appears so the
 * announcement and the way to each field are one Tab away; each entry moves focus to its control.
 */
export function ErrorSummary({ title, errors }: { title: string; errors: ErrorSummaryItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = errors.map((e) => e.fieldId).join('|');
  useEffect(() => {
    if (key) ref.current?.focus();
  }, [key]);
  if (errors.length === 0) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-shape-md bg-danger-soft p-4 text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <p className="t-label flex items-center gap-2">
        <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
        {title}
      </p>
      <ul className="t-body-sm mt-2 list-disc ps-9">
        {errors.map((e) => (
          <li key={e.fieldId}>
            <a
              href={`#${e.fieldId}`}
              className="underline underline-offset-[3px]"
              onClick={(ev) => {
                const el = document.getElementById(e.fieldId);
                if (el) {
                  ev.preventDefault();
                  el.focus();
                }
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
