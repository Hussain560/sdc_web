'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

/** A select that sends its form as soon as the value changes (`auto`); the Apply button stays for keyboards and no-JS. */
export function FilterSelect({
  auto,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { auto?: boolean }) {
  return (
    <select
      {...props}
      onChange={auto ? (e) => e.currentTarget.form?.requestSubmit() : undefined}
    />
  );
}

/**
 * Phone filters: a button with the number of active filters that opens a bottom sheet. The sheet's fields sit inside
 * the page's search form, so Apply is a plain GET and the URL stays the one source of truth.
 */
export function FilterSheet({
  label,
  count,
  title,
  apply,
  closeLabel,
  children,
}: {
  label: string;
  count: number;
  title: string;
  apply: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="shrink-0"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal aria-hidden="true" className="size-5" strokeWidth={1.75} />
        {count > 0 ? `${label} (${count})` : label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        closeLabel={closeLabel}
        presentation="sheet"
        footer={
          <Button type="submit" size="lg">
            {apply}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">{children}</div>
      </Dialog>
    </>
  );
}
