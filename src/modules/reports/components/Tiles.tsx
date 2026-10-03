import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import type { Trend } from '../format';

/** A metric with its change against the previous period (arrow + number, never colour alone). */
export function MetricTile({
  label,
  value,
  trend,
  note,
  vsLabel,
}: {
  label: string;
  value: string;
  trend?: Trend;
  note?: string;
  vsLabel?: string;
}) {
  const Icon = trend?.dir === 'up' ? ArrowUp : trend?.dir === 'down' ? ArrowDown : Minus;
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="flex items-center gap-1 text-xs text-muted">
        {trend ? (
          <>
            <Icon size={14} aria-hidden="true" />
            <span className="tabular-nums">{trend.text}</span>
            {vsLabel && <span>{vsLabel}</span>}
          </>
        ) : (
          (note ?? ' ')
        )}
      </p>
    </Card>
  );
}
