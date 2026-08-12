'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bell, CheckCheck, UserPlus, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}

const TYPE_META: Record<string, { icon: typeof UserPlus; color: string; bg: string }> = {
  player_join_request: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
  payment: { icon: Banknote, color: 'text-green-600', bg: 'bg-green-100' },
};

export default function AdminNotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notif-list'],
    queryFn: () => api.notifications.adminList(),
  });
  const notifications = data?.data ?? [];

  const handleMarkAll = async () => {
    try {
      await api.notifications.adminMarkAllRead();
      qc.invalidateQueries({ queryKey: ['admin-notif-list'] });
      qc.invalidateQueries({ queryKey: ['admin-notif-count'] });
      toast.success('Todas marcadas como leídas');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.adminMarkRead(id);
      qc.invalidateQueries({ queryKey: ['admin-notif-list'] });
      qc.invalidateQueries({ queryKey: ['admin-notif-count'] });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones del panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Altas de jugadores y pagos que requieren tu atención
          </p>
        </div>
        {notifications.some((n: any) => !n.read) && (
          <Button variant="outline" className="gap-2" onClick={handleMarkAll}>
            <CheckCheck size={15} /> Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Bell size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin notificaciones</p>
          <p className="mt-1 text-sm">Acá vas a ver altas de jugadores y pagos nuevos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' };
            const Icon = meta.icon;
            const isJoin = n.type === 'player_join_request';
            const href = isJoin ? '/club/join-requests' : '/club/payments';
            return (
              <Card
                key={n.id}
                className={n.read ? 'opacity-60' : ''}
                onClick={() => handleMarkRead(n.id)}
              >
                <CardContent className="flex cursor-pointer items-start gap-3 pt-6">
                  <div className={`flex-shrink-0 rounded-full p-2 ${meta.bg}`}>
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-red" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{formatDate(n.createdAt)}</p>
                  </div>
                  {isJoin && (
                    <Link href={href} onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Revisar
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
