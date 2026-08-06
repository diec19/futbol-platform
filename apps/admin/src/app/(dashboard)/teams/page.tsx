'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { teamFormSchema, type TeamFormValues } from '@/lib/validations';
import { Shield, Plus, X, Pencil, Check, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface TeamForm {
  name: string;
  delegateName: string;
  delegateContact: string;
  categoryId: string;
}

const EMPTY_FORM: TeamForm = { name: '', delegateName: '', delegateContact: '', categoryId: '' };

export default function TeamsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TeamForm>(EMPTY_FORM);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: '', delegateName: '', delegateContact: '', categoryId: '' },
  });

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams', page, debouncedSearch],
    queryFn: () => api.teams.list({
      page: String(page),
      limit: '20',
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => api.categories.list({ limit: '100' }),
  });

  const teams = (teamsData as any)?.data ?? [];
  const meta = (teamsData as any)?.meta;
  const categories = categoriesData?.data ?? [];

  const create = useMutation({
    mutationFn: (values: TeamFormValues) => api.teams.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setShowForm(false);
      reset();
      toast.success('Equipo creado correctamente');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = async (values: TeamFormValues) => {
    try {
      await create.mutateAsync(values);
    } catch {
      // El toast de error lo maneja onError del mutation
    }
  };

  const update = useMutation({
    mutationFn: (id: string) => api.teams.update(id, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setEditId(null);
      toast.success('Equipo actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.teams.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipo eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  function startEdit(team: any) {
    setEditId(team.id);
    setEditForm({
      name: team.name,
      delegateName: team.delegateName ?? '',
      delegateContact: team.delegateContact ?? '',
      categoryId: team.categoryId ?? '',
    });
  }

  const set = (field: keyof TeamForm, setter: React.Dispatch<React.SetStateAction<TeamForm>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipos</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? teams.length} equipos registrados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo equipo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Nuevo equipo</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Cerrar formulario">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="team-name">Nombre *</Label>
                <Input
                  id="team-name"
                  placeholder="Nombre del equipo"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-category">Categoría *</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="team-category">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-delegate">Delegado</Label>
                <Input
                  id="team-delegate"
                  placeholder="Nombre del delegado"
                  {...register('delegateName')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-contact">Contacto</Label>
                <Input
                  id="team-contact"
                  placeholder="Teléfono / email"
                  {...register('delegateContact')}
                />
              </div>
              <div className="flex gap-3 md:col-span-2">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear equipo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setTimeout(() => setDebouncedSearch(e.target.value), 300);
          }}
          placeholder="Buscar equipo..."
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center">
            <Shield size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No hay equipos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Delegado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Jugadores</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team: any) => (
                editId === team.id ? (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Input value={editForm.name} onChange={set('name', setEditForm)} />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.delegateName} onChange={set('delegateName', setEditForm)} />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.delegateContact} onChange={set('delegateContact', setEditForm)} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editForm.categoryId}
                        onValueChange={(v) => setEditForm(f => ({ ...f, categoryId: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin categoría</SelectItem>
                          {categories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => update.mutate(team.id)}
                          disabled={update.isPending}
                          className="text-emerald-600 hover:bg-emerald-50"
                          aria-label="Confirmar edición"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditId(null)} aria-label="Cancelar edición">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Shield size={14} className="text-muted-foreground" />
                        </div>
                        <p className="font-medium">{team.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{team.delegateName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{team.delegateContact ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{team.category?.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{team._count?.players ?? team.players?.length ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(team)} aria-label="Editar equipo">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Eliminar equipo"
                          description={`¿Eliminar el equipo "${team.name}"? Esta acción no se puede deshacer.`}
                          confirmLabel="Eliminar"
                          destructive
                          onConfirm={() => remove.mutate(team.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Eliminar equipo">
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
