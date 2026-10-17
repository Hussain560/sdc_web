'use client';

import { Eye, Rocket } from 'lucide-react';
import { useState } from 'react';
import { SegmentedToggle } from '@/components/ui/Chips';

/**
 * Vision and mission as one band with a two-way toggle. Both texts are real content: the toggle only changes which one
 * is read aloud and shown (`aria-live`), and starts on the vision.
 */
export function VisionMission({
  title,
  choose,
  vision,
  mission,
}: {
  title: string;
  choose: string;
  vision: { label: string; text: string };
  mission: { label: string; text: string };
}) {
  const [view, setView] = useState<'vision' | 'mission'>('vision');
  const current = view === 'vision' ? vision : mission;
  const Icon = view === 'vision' ? Eye : Rocket;
  return (
    <section
      aria-labelledby="ab-vm"
      className="m-reveal relative mt-(--section-gap) overflow-hidden rounded-shape-2xl bg-band p-8 md:p-12 lg:p-20"
    >
      <div
        aria-hidden="true"
        className="motif-dots pointer-events-none absolute -start-10 -top-14 size-64 text-accent-text opacity-70"
      />
      <div className="relative flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="ab-vm" className="t-h2 flex items-center gap-3">
            <span aria-hidden="true" className="signal-dots" />
            {title}
          </h2>
          <SegmentedToggle
            label={choose}
            value={view}
            onChange={setView}
            options={[
              { value: 'vision', label: vision.label },
              { value: 'mission', label: mission.label },
            ]}
          />
        </div>
        <div className="flex items-start gap-5 md:gap-8">
          <span
            aria-hidden="true"
            className="hidden size-[72px] shrink-0 items-center justify-center rounded-shape-xl bg-accent-soft text-on-accent-soft sm:flex"
          >
            <Icon className="size-9" strokeWidth={1.75} />
          </span>
          <p
            aria-live="polite"
            className="max-w-[26ch] text-[length:clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-[1.55] font-bold"
          >
            {current.text}
          </p>
        </div>
      </div>
    </section>
  );
}
