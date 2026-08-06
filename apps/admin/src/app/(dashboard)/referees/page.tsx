'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Flag, Plus, X, Pencil, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

interface RefereeForm {
  fullName: string;
  dni: string;
  phone: string;
  email: string;
}

const EMPTY_FORM: RefereeForm = { fullName: '', dni: '', phone: '', email: '' };

export default function RefereesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RefereeForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<RefereeForm>(EMPTY_FORM);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['referees', page],
    queryFn: () => api.referees.list({ page: String(page), limit: '20' }),
  });

  const referees = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const create = useMutation({
    mutationFn: () => api.referees.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referees'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Árbitro creado correctamente');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const update = useMutation({
    mutationFn: (id: string) => api.referees.update(id, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referees'] });
      setEditId(null);
      toast.success('Árbitro actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.referees.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referees'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.referees.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referees'] });
      toast.success('Árbitro eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  function startEdit(ref: any) {
    setEditId(ref.id);
    setEditForm({
      fullName: ref.fullName,
      dni: ref.dni ?? '',
      phone: ref.phone ?? '',
      email: ref.email ?? '',
    });
  }

  const set = (field: keyof RefereeForm, setter: React.Dispatch<React.SetStateAction<RefereeForm>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Árbitros</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? referees.length} árbitros registrados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo árbitro
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Nuevo árbitro</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre completo *</Label>
                <Input
                  value={form.fullName}
                  onChange={set('fullName', setForm)}
                  placeholder="Nombre y apellido"
                />
              </div>
              <div className="space-y-1.5">
                <Label>DNI</Label>
                <Input value={form.dni} onChange={set('dni', setForm)} placeholder="12345678" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={set('phone', setForm)}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set('email', setForm)}
                  placeholder="arbitro@email.com"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || !form.fullName}
              >
                {create.isPending ? 'Creando...' : 'Crear árbitro'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : referees.length === 0 ? (
          <div className="p-8 text-center">
            <Flag size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No hay árbitros registrados</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Agregá árbitros para asignarlos a los partidos
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Árbitro</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {referees.map((ref: any) => (
                editId === ref.id ? (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <Input value={editForm.fullName} onChange={set('fullName', setEditForm)} />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.dni} onChange={set('dni', setEditForm)} />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.phone} onChange={set('phone', setEditForm)} />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.email} onChange={set('email', setEditForm)} />
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => update.mutate(ref.id)}
                          disabled={update.isPending}
                          className="text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {ref.fullName[0]?.toUpperCase()}
                        </div>
                        <p className="font-medium">{ref.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ref.dni ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{ref.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{ref.email ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggle.mutate(ref.id)}
                        className={`h-6 px-2 text-xs font-medium ${ref.active ? 'text-emerald-700' : 'text-muted-foreground'}`}
                      >
                        {ref.active ? 'Activo' : 'Inactivo'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(ref)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Eliminar árbitro"
                          description={`¿Eliminar a "${ref.fullName}"? Esta acción no se puede deshacer.`}
                          confirmLabel="Eliminar"
                          destructive
                          onConfirm={() => remove.mutate(ref.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {meta.page} de {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
