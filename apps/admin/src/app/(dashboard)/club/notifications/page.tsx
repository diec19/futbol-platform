'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Bell, Plus, Trash2, Globe, User, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ memberId: '', title: '', message: '', type: 'global' });
  const [memberSearch, setMemberSearch] = useState('');

  const { data: notifsRes, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  });
  const { data: membersRes } = useQuery({
    queryKey: ['members-all'],
    queryFn: () => api.members.list(),
    enabled: showForm,
  });

  const notifications = notifsRes?.data ?? [];
  const members = membersRes?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => api.notifications.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setShowForm(false);
      setForm({ memberId: '', title: '', message: '', type: 'global' });
      toast.success('Notificación enviada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.notifications.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificación eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filteredMembers = members.filter(
    (m: any) =>
      m.fullName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.dni?.includes(memberSearch)
  );

  const typeBtn = (value: string, label: string, icon: React.ReactNode, activeClass: string) => (
    <Button
      type="button"
      variant="outline"
      className={`gap-2 border ${form.type === value ? activeClass : 'text-muted-foreground hover:bg-muted'}`}
      onClick={() => set('type', value)}
    >
      {icon}
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná las notificaciones para los socios
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nueva notificación
        </Button>
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
          <p className="font-medium">No hay notificaciones enviadas</p>
          <p className="mt-1 text-sm">Creá la primera notificación para tus socios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <Card key={n.id}>
              <CardContent className="flex items-start gap-3 pt-6">
                <div
                  className={`flex-shrink-0 rounded-full p-2 ${
                    n.type === 'global' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}
                >
                  {n.type === 'global' ? (
                    <Globe size={16} className="text-blue-600" />
                  ) : (
                    <User size={16} className="text-purple-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{n.title}</p>
                    {n.read && <CheckCheck size={14} className="text-green-500" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(n.createdAt)}</span>
                    <Badge
                      variant={n.type === 'global' ? 'info' : 'secondary'}
                      className="rounded-full text-xs"
                    >
                      {n.type === 'global' ? 'Global' : 'Personal'}
                    </Badge>
                    {n.member && <span>Para: {n.member.fullName}</span>}
                  </div>
                </div>
                <ConfirmDialog
                  title="Eliminar notificación"
                  description="¿Eliminar esta notificación? Esta acción no se puede deshacer."
                  confirmLabel="Eliminar"
                  destructive
                  onConfirm={() => deleteMutation.mutate(n.id)}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={(open) => !open && setShowForm(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva notificación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <div className="flex gap-2">
                  {typeBtn(
                    'global',
                    'Global (todos)',
                    <Globe size={14} />,
                    'border-blue-200 bg-blue-50 text-blue-700'
                  )}
                  {typeBtn(
                    'personal',
                    'Personal',
                    <User size={14} />,
                    'border-purple-200 bg-purple-50 text-purple-700'
                  )}
                </div>
              </div>

              {form.type === 'personal' && (
                <div className="space-y-1.5">
                  <Label>Buscar socio</Label>
                  <Input
                    placeholder="Nombre o DNI..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border p-1">
                    {filteredMembers.length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">Sin resultados</p>
                    ) : (
                      filteredMembers.map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            set('memberId', m.id);
                            setMemberSearch(m.fullName);
                          }}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            form.memberId === m.id
                              ? 'bg-purple-50 text-purple-700'
                              : 'text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {m.fullName} {m.dni ? `- ${m.dni}` : ''}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  placeholder="Ej: Recordatorio de cuota"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mensaje</Label>
                <Textarea
                  rows={4}
                  placeholder="Escribí el mensaje de la notificación..."
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!form.title || !form.message) return;
                  if (form.type === 'personal' && !form.memberId) return;
                  createMutation.mutate({
                    title: form.title,
                    message: form.message,
                    type: form.type,
                    memberId: form.type === 'personal' ? form.memberId : undefined,
                  });
                }}
              >
                Enviar notificación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
