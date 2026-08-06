'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Users, GraduationCap, UserCheck, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActiveBadge } from '@/components/domain/status-badge';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

const EMPTY_FORM = { name: '', description: '', birthYear: '', coach: '', assistant: '' };

function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    category
      ? {
          name: category.name,
          description: category.description ?? '',
          birthYear: category.birthYear ? String(category.birthYear) : '',
          coach: category.coach ?? '',
          assistant: category.assistant ?? '',
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        coach: form.coach || undefined,
        assistant: form.assistant || undefined,
      };
      if (category) {
        await api.club.categories.update(category.id, payload);
      } else {
        await api.club.categories.create(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Sub-13, Infantil, Reserva..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Año de nacimiento</Label>
              <Input type="number" value={form.birthYear} onChange={set('birthYear')} placeholder="2012" />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input value={form.description} onChange={set('description')} placeholder="Detalles opcionales" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                <GraduationCap size={12} className="mr-1 inline" />
                Profesor / DT
              </Label>
              <Input value={form.coach} onChange={set('coach')} placeholder="Nombre del profe" />
            </div>
            <div className="space-y-1.5">
              <Label>
                <UserCheck size={12} className="mr-1 inline" />
                Ayudante
              </Label>
              <Input value={form.assistant} onChange={set('assistant')} placeholder="Nombre del ayudante" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClubCategoriasPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['club-categories'],
    queryFn: () => api.club.categories.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (cat: any) => api.club.categories.update(cat.id, { active: !cat.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-categories'] }),
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.categories.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-categories'] });
      toast.success('Categoría eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const categories = data?.data ?? [];

  const onSaved = () => {
    setShowCreate(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['club-categories'] });
    toast.success('Categoría guardada');
  };

  return (
    <div className="space-y-6">
      {showCreate && <CategoryModal onClose={() => setShowCreate(false)} onSaved={onSaved} />}
      {editing && <CategoryModal category={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías del Club</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length} categorías registradas
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="space-y-3 rounded-xl border bg-card p-12 text-center">
          <Layers size={40} className="mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No hay categorías registradas</p>
          <p className="text-sm text-muted-foreground/70">
            Creá la primera categoría del club (Sub-11, Sub-13, Infantil, etc.)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat: any) => (
            <Card key={cat.id} className="group">
              <CardContent className="space-y-4 pt-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-navy/10">
                      <span className="text-sm font-bold text-brand-navy">
                        {cat.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold">{cat.name}</p>
                      {cat.birthYear && (
                        <p className="text-xs text-muted-foreground">Año {cat.birthYear}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-brand-blue"
                      onClick={() => setEditing(cat)}
                      title="Editar"
                      aria-label="Editar categoría"
                    >
                      <Pencil size={14} />
                    </Button>
                    <ConfirmDialog
                      title="Eliminar categoría"
                      description={`Se eliminará ${cat.name}. Los jugadores asignados quedarán sin categoría.`}
                      confirmLabel="Eliminar"
                      destructive
                      onConfirm={() => deleteMutation.mutate(cat.id)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Eliminar"
                          aria-label="Eliminar categoría"
                        >
                          <Trash2 size={14} />
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* Staff */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} className="flex-shrink-0 text-brand-red" />
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground">Profe / DT: </span>
                      <span className="text-sm font-medium">
                        {cat.coach ?? <span className="italic text-muted-foreground/60">Sin asignar</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="flex-shrink-0 text-brand-blue" />
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground">Ayudante: </span>
                      <span className="text-sm font-medium">
                        {cat.assistant ?? <span className="italic text-muted-foreground/60">Sin asignar</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {cat.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{cat.description}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users size={13} />
                    <span className="text-xs font-medium">{cat._count?.players ?? 0} jugadores</span>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate(cat)}
                    disabled={toggleMutation.isPending}
                    className="rounded-full text-xs font-medium transition-colors"
                  >
                    <ActiveBadge active={cat.active} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
