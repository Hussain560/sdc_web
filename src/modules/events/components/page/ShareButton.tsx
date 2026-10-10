'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/** Native share sheet where it exists, otherwise copies the link (a toast confirms). */
export function ShareButton({
  title,
  label,
  copied,
}: {
  title: string;
  label: string;
  copied: string;
}) {
  const toast = useToast();
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(copied);
    } catch {
      /* dismissed share sheet or blocked clipboard: nothing to report */
    }
  }
  return (
    <Button
      variant="ghost"
      size="md"
      iconStart={<Share2 aria-hidden="true" className="size-5" />}
      onClick={share}
    >
      {label}
    </Button>
  );
}
