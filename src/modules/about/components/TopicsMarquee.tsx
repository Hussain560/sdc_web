'use client';

import { Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * The strip of fields the community works in. It moves slowly, pauses on hover or focus, and has a real pause button
 * (moving content that lasts longer than five seconds needs one). Screen readers get the topics once, as a list.
 */
export function TopicsMarquee({
  label,
  topics,
  pause,
  play,
}: {
  label: string;
  topics: ReadonlyArray<string>;
  pause: string;
  play: string;
}) {
  const [paused, setPaused] = useState(false);
  const row = [...topics, ...topics];
  return (
    <div
      role="region"
      aria-label={label}
      data-paused={paused}
      className="m-marq relative mt-14 overflow-hidden border-y border-line py-5"
    >
      <div aria-hidden="true" className="m-marq-track">
        {row.map((topic, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-4 text-[length:clamp(1.5rem,1.2rem+1vw,2.25rem)] font-bold whitespace-nowrap',
              i % 2 ? 'text-muted' : 'text-text',
            )}
          >
            {topic}
            <span className="inline-flex gap-1">
              <span className="size-2.5 rounded-full bg-signal" />
              <span className="size-2.5 rounded-full bg-signal" />
            </span>
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? play : pause}
        className="absolute end-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-text hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {paused ? (
          <Play aria-hidden="true" className="size-5" />
        ) : (
          <Pause aria-hidden="true" className="size-5" />
        )}
      </button>
    </div>
  );
}
