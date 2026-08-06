'use client';

import { CheckCircle, Pause, Clock, X } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const SPONSOR_STATUS: Record<string, { label: string; variant: NonNullable<BadgeProps['variant']>; icon: typeof Clock }> = {
  ACTIVE: { label: 'Activo', variant: 'success', icon: CheckCircle },
  PAUSED: { label: 'Pausado', variant: 'warning', icon: Pause },
  EXPIRED: { label: 'Vencido', variant: 'neutral', icon: Clock },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: X },
};

export function SponsorStatusBadge({ status }: { status: string }) {
  const cfg = SPONSOR_STATUS[status] ?? SPONSOR_STATUS.ACTIVE;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1 rounded-full">
      <Icon size={11} />
      {cfg.label}
    </Badge>
  );
}
