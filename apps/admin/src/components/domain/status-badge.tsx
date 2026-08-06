'use client';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { MATCH_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from '@futbol/constants';

const STATUS_VARIANTS: Record<string, NonNullable<BadgeProps['variant']>> = {
  // Tournament
  DRAFT: 'neutral',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  FINISHED: 'info',
  // Match
  SCHEDULED: 'neutral',
  LIVE: 'success',
  POSTPONED: 'warning',
  CANCELLED: 'destructive',
};

const STATUS_LABELS: Record<string, string> = {
  ...TOURNAMENT_STATUS_LABELS,
  ...MATCH_STATUS_LABELS,
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'} className={className}>
      {label ?? STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function ActiveBadge({ active, label }: { active: boolean; label?: string }) {
  return (
    <Badge variant={active ? 'success' : 'neutral'}>{label ?? (active ? 'Activa' : 'Inactiva')}</Badge>
  );
}
