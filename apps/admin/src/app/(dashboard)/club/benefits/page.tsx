'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Gift, Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActiveBadge } from '@/components/domain/status-badge';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

const TYPE_CFG: Record<string, { label: string; variant: NonNullable<BadgeProps['variant']> }> = {
  EXTERNAL: { label: 'Descuento externo', variant: 'info' },
  INTERNAL: { label: 'Beneficio del club', variant: 'success' },
};

function BenefitModal({
  benefit,
  sponsors,
  onClose,
  onSaved,
}: {
  benefit?: any;
  sponsors: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    benefit
      ? {
          title: benefit.title,
          description: benefit.description ?? '',
          imageUrl: benefit.imageUrl ?? '',
          type: benefit.type ?? 'EXTERNAL',
          sponsorId: benefit.sponsorId ?? 'none',
        }
      : { title: '', description: '', imageUrl: '', type: 'EXTERNAL', sponsorId: 'none' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('El título es requerido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = { title: form.title.trim() };
      if (form.description) payload.description = form.description;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.type) payload.type = form.type;
      if (form.sponsorId !== 'none') payload.sponsorId = form.sponsorId;

      if (benefit) {
        await api.benefits.update(benefit.id, payload);
      } else {
        await api.benefits.create(payload);
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
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{benefit ? 'Editar beneficio' : 'Nuevo beneficio'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={set('title')} placeholder="Ej: 10% en Deportes Total" />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              placeholder="Descripción del beneficio"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Imagen (URL JPG/PNG)</Label>
            <Input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://...imagen.jpg" />
            {form.imageUrl && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-32 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTERNAL">Descuento externo</SelectItem>
                  <SelectItem value="INTERNAL">Beneficio del club</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Auspiciante (opcional)</Label>
              <Select value={form.sponsorId} onValueChange={(v) => setForm((f) => ({ ...f, sponsorId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin auspiciante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin auspiciante</SelectItem>
                  {sponsors.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BenefitsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editBenefit, setEditBenefit] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['benefits-admin'],
    queryFn: () => api.benefits.listAll(),
  });

  const { data: sponsorsData } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.sponsors.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.benefits.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['benefits-admin'] }),
    onError: (err: any) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.benefits.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['benefits-admin'] });
      toast.success('Beneficio eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const benefits = data?.data ?? [];
  const sponsors = sponsorsData?.data ?? [];

  const onSaved = () => {
    setShowNew(false);
    setEditBenefit(null);
    qc.invalidateQueries({ queryKey: ['benefits-admin'] });
    toast.success('Beneficio guardado');
  };

  return (
    <div className="space-y-6">
      {(showNew || editBenefit) && (
        <BenefitModal
          benefit={editBenefit}
          sponsors={sponsors}
          onClose={() => {
            setShowNew(false);
            setEditBenefit(null);
          }}
          onSaved={onSaved}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beneficios</h1>
          <p className="mt-1 text-sm text-muted-foreground">{benefits.length} beneficios registrados</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Nuevo beneficio
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : benefits.length === 0 ? (
        <div className="space-y-3 p-12 text-center">
          <Gift size={40} className="mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No hay beneficios registrados</p>
          <p className="text-sm text-muted-foreground/70">
            Agregá beneficios para que los socios los vean en la app
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit: any) => {
            const typeCfg = TYPE_CFG[benefit.type] ?? TYPE_CFG.EXTERNAL;
            return (
              <Card key={benefit.id} className="overflow-hidden">
                {benefit.imageUrl ? (
                  <div className="h-40 bg-muted">
                    <img src={benefit.imageUrl} alt={benefit.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-red/10 to-brand-red/5">
                    <Gift size={40} className="text-brand-red/30" />
                  </div>
                )}
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold">{benefit.title}</h3>
                    <Badge variant={typeCfg.variant} className="rounded-full text-[10px]">
                      {typeCfg.label}
                    </Badge>
                  </div>
                  {benefit.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{benefit.description}</p>
                  )}
                  {benefit.sponsor && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 size={11} />
                      {benefit.sponsor.name}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-2">
                    <button>
                      <ActiveBadge active={benefit.active} />
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                        onClick={() => toggleMutation.mutate(benefit.id)}
                        title={benefit.active ? 'Desactivar' : 'Activar'}
                      >
                        {benefit.active ? <EyeOff size={13} /> : <Eye size={13} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditBenefit(benefit)}
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </Button>
                      <ConfirmDialog
                        title="Eliminar beneficio"
                        description={`¿Eliminar "${benefit.title}"? Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => removeMutation.mutate(benefit.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 size={13} />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
