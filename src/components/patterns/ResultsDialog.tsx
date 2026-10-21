'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';
import { Button, Dialog } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

export type RowResult = { id: string; ok: boolean; message?: string | null };

/**
 * The per-row answer after a bulk action: what was done and what was skipped, and why (components §6, the bulk
 * decision rule: a blocked row never hides the rest). Names come from the caller, so a row reads as a person.
 */
export function ResultsDialog({
  open,
  onClose,
  title,
  results,
  nameOf,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  results: RowResult[];
  nameOf: (id: string) => string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const done = results.filter((r) => r.ok).length;
  const skipped = results.length - done;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={
        skipped === 0
          ? ar
            ? `تم تنفيذ الإجراء على ${done}.`
            : `Done for ${done}.`
          : ar
            ? `تم على ${done}، وتُخطّي ${skipped}.`
            : `Done for ${done}, skipped ${skipped}.`
      }
      footer={<Button onClick={onClose}>{ar ? 'تم' : 'Done'}</Button>}
      closeLabel={ar ? 'إغلاق' : 'Close'}
    >
      <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {results.map((r) => (
          <li key={r.id} className="flex items-start gap-2 text-sm">
            {r.ok ? (
              <CircleCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
            ) : (
              <CircleAlert size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
            )}
            <span className={r.ok ? '' : 'text-warning'}>
              <span className="font-medium">{nameOf(r.id)}</span>
              {r.ok
                ? ar
                  ? ': تم'
                  : ': done'
                : r.message
                  ? `: ${r.message}`
                  : ar
                    ? ': تُخطّي'
                    : ': skipped'}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
