'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

export function TeamsTab({ categoryId }: { categoryId: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', delegateName: '', contact: '' });

  const { data } = useQuery({
    queryKey: ['teams', categoryId],
    queryFn: () => api.teams.list({ categoryId }),
  });

  const create = useMutation({
    mutationFn: () => api.teams.create({ categoryId, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', categoryId] });
      setShowForm(false);
      setForm({ name: '', delegateName: '', contact: '' });
      toast.success('Equipo creado correctamente');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.teams.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', categoryId] });
      toast.success('Equipo eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const teams = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{teams.length} equipos registrados</p>
        <Button
          variant={showForm ? 'outline' : 'default'}
          size="sm"
          onClick={() => setShowForm(s => !s)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> {showForm ? 'Cancelar' : 'Agregar equipo'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-muted/50 p-4 space-y-3">
          <h3 className="font-medium text-sm">Nuevo equipo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Club Atlético"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Delegado</Label>
              <Input
                value={form.delegateName}
                onChange={e => setForm(f => ({ ...f, delegateName: e.target.value }))}
                placeholder="Nombre del delegado"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Input
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="Teléfono o email"
              />
            </div>
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.name}
          >
            {create.isPending ? 'Guardando...' : 'Guardar equipo'}
          </Button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-card">
        {teams.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No hay equipos en esta categoría</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Delegado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Jugadores</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.delegateName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{t.contact ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t._count?.players ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmDialog
                      title="Eliminar equipo"
                      description={`¿Eliminar "${t.name}"? Esta acción no se puede deshacer.`}
                      confirmLabel="Eliminar"
                      destructive
                      onConfirm={() => remove.mutate(t.id)}
                      trigger={
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Eliminar equipo">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
