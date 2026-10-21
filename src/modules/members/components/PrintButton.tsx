'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui';

export function PrintButton({ label }: { label: string }) {
  return (
    <Button
      className="print:hidden"
      iconStart={<Printer size={16} aria-hidden="true" />}
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
