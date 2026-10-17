'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

/** Shares the profile link: the device share sheet when there is one, otherwise it copies the link. */
export function ShareButton({
  label,
  doneLabel,
  title,
}: {
  label: string;
  doneLabel: string;
  title: string;
}) {
  const [done, setDone] = useState(false);

  async function share() {
    const url = window.location.href.split('#')[0]!;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      /* the person closed the share sheet, or the clipboard is blocked: nothing to report */
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={share}>
        {done ? <Check aria-hidden="true" className="size-5" /> : <Share2 aria-hidden="true" className="size-5" />}
        {done ? doneLabel : label}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {done ? doneLabel : ''}
      </span>
    </>
  );
}
