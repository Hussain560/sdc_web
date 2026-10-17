'use client';

import { Pause, Play } from 'lucide-react';
import { m, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { MEMBERS_COPY } from '../members/components/public/members-copy';
import type { HomeMember } from './data';

type Lang = 'ar' | 'en';

function Person({ member, lang, hidden }: { member: HomeMember; lang: Lang; hidden: boolean }) {
  const name = lang === 'en' ? member.nameEn : member.nameAr;
  const line = lang === 'en' ? (member.trackEn ?? member.trackAr) : member.trackAr;
  return (
    <li dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-72 shrink-0 md:w-96">
      <Link
        href={`/members/${member.id}`}
        tabIndex={hidden ? -1 : undefined}
        className="flex h-full items-center gap-5 rounded-shape-xl border border-line bg-surface p-5 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Avatar name={name} src={member.thumb} size={72} className="size-20! md:size-24!" />
        <span className="min-w-0">
          <span className="block truncate text-lg font-semibold md:text-xl">{name}</span>
          <span className="t-body block truncate text-muted">{line ?? ' '}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * One row of the strip. The list is rendered twice and the track slides by exactly one copy, so the loop has no seam.
 * `speed` eases to zero over about 600 ms when the person hovers, focuses or drags, and back again afterwards; a touch
 * stops the row and it resumes three seconds after the finger leaves. The second copy is hidden from assistive tech
 * and cannot be tabbed to.
 */
function Row({
  members,
  lang,
  seconds,
  reverse,
  paused,
}: {
  members: HomeMember[];
  lang: Lang;
  seconds: number;
  reverse: boolean;
  paused: boolean;
}) {
  const x = useMotionValue(0);
  const copy = useRef<HTMLUListElement>(null);
  const factor = useRef(1);
  const holdUntil = useRef(0);
  const over = useRef(false);
  const dragging = useRef(false);

  useAnimationFrame((time, delta) => {
    const width = copy.current?.offsetWidth ?? 0;
    if (!width) return;
    const idle = !paused && !over.current && !dragging.current && time >= holdUntil.current;
    // ease the speed toward 1 or 0 (time constant 200 ms: about 600 ms to stop)
    factor.current += ((idle ? 1 : 0) - factor.current) * (1 - Math.exp(-delta / 200));
    let next = x.get() + (reverse ? 1 : -1) * (width / seconds) * (delta / 1000) * factor.current;
    // keep the position inside one copy so the loop never runs out of track
    next = ((next % width) - width) % width;
    x.set(next);
  });

  const hold = useCallback((ms: number) => {
    holdUntil.current = performance.now() + ms;
  }, []);

  return (
    <div
      dir="ltr"
      className="overflow-hidden py-1"
      style={{
        // cards fade out at both ends instead of stopping at a hard edge
        maskImage: 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') over.current = true;
      }}
      onPointerLeave={() => {
        over.current = false;
      }}
      onFocusCapture={() => {
        over.current = true;
      }}
      onBlurCapture={() => {
        over.current = false;
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') hold(60_000);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === 'touch') hold(3000);
      }}
    >
      <m.div
        drag="x"
        dragMomentum
        dragElastic={0}
        style={{ x }}
        onDragStart={() => {
          dragging.current = true;
        }}
        onDragEnd={() => {
          dragging.current = false;
          hold(1200);
        }}
        className="flex w-max cursor-grab touch-pan-y active:cursor-grabbing"
      >
        <ul ref={copy} className="flex gap-5 pe-5">
          {members.map((p, i) => (
            <Person key={`${p.id}-${i}`} member={p} lang={lang} hidden={false} />
          ))}
        </ul>
        <ul aria-hidden="true" className="flex gap-5 pe-5" {...{ inert: true }}>
          {members.map((p, i) => (
            <Person key={`${p.id}-${i}`} member={p} lang={lang} hidden />
          ))}
        </ul>
      </m.div>
    </div>
  );
}

/**
 * The home members strip (RDS-035): three rows: the first and third move left, the middle one right, at 70 s, 85 s and 78 s per loop, with a pause
 * button (WCAG 2.2.2). With reduced motion it is a still grid of eight. A person's dragging works on touch and mouse.
 */
function Strip({ members, lang }: { members: HomeMember[]; lang: Lang }) {
  const t = MEMBERS_COPY[lang];
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);

  if (reduced) {
    return (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {members.slice(0, 8).map((p) => (
          <Person key={p.id} member={p} lang={lang} hidden={false} />
        ))}
      </ul>
    );
  }
  // Three rows, dealt in turn so each row shows a different part of the day's order. A row is filled up to six cards by
  // repeating its own people, so it always has a full loop and never shows a gap. The first and third rows move left,
  // the middle one right, so the three read as one wall of people.
  const rows = [0, 1, 2].map((r) => {
    const own = members.filter((_, i) => i % 3 === r);
    const filled: HomeMember[] = [];
    for (let i = 0; own.length > 0 && filled.length < Math.max(6, own.length); i++) {
      filled.push(own[i % own.length]!);
    }
    return filled;
  });
  return (
    <div className="flex flex-col gap-4">
      <Row members={rows[0]!} lang={lang} seconds={70} reverse={false} paused={paused} />
      <Row members={rows[1]!} lang={lang} seconds={85} reverse paused={paused} />
      <Row members={rows[2]!} lang={lang} seconds={78} reverse={false} paused={paused} />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? (
            <Play aria-hidden="true" className="size-4" />
          ) : (
            <Pause aria-hidden="true" className="size-4" />
          )}
          {paused ? t.play : t.pause}
        </Button>
      </div>
    </div>
  );
}

export function MemberMarquee({ members, lang }: { members: HomeMember[]; lang: Lang }) {
  return (
    <MotionProvider features="max">
      <Strip members={members} lang={lang} />
    </MotionProvider>
  );
}
