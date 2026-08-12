'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminNotificationBell({ className }: { className?: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-notif-count'],
    queryFn: () => api.notifications.adminCount(),
    refetchInterval: 30000,
  });
  const count = data?.data?.count ?? 0;

  // Al volver a la bandeja, refresca el contador (el usuario marca leídas allá)
  useQuery({
    queryKey: ['admin-notif-list'],
    queryFn: () => api.notifications.adminList(),
    enabled: false,
  });

  const handleClick = () => {
    qc.invalidateQueries({ queryKey: ['admin-notif-list'] });
  };

  return (
    <Button asChild variant="ghost" size="icon" className={cn('relative', className)} onClick={handleClick} aria-label="Notificaciones de administración">
      <Link href="/club/admin-notifications">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
