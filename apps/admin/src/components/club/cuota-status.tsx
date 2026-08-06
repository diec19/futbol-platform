'use client';

import { Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/badge';

export const CUOTA_STATUS: Record<
  string,
  { label: string; variant: NonNullable<BadgeProps['variant']>; icon: typeof Clock }
> = {
  PENDING: { label: 'Pendiente', variant: 'neutral', icon: Clock },
  LINK_SENT: { label: 'Link enviado', variant: 'info', icon: Send },
  PAID: { label: 'Pagada', variant: 'success', icon: CheckCircle },
  OVERDUE: { label: 'Vencida', variant: 'destructive', icon: AlertCircle },
};

export function CuotaStatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = CUOTA_STATUS[status] ?? CUOTA_STATUS.PENDING;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className={cn('gap-1 rounded-full', className)}>
      <Icon size={11} />
      {cfg.label}
    </Badge>
  );
}
