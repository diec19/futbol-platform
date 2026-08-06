'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PlanModal({
  plan,
  sponsor,
  onClose,
  onSaved,
}: {
  plan?: any;
  sponsor?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    plan
      ? {
          name: plan.name,
          monthlyAmount: String(plan.monthlyAmount),
          durationMonths: String(plan.durationMonths),
          description: plan.description ?? '',
        }
      : { name: '', monthlyAmount: '', durationMonths: '6', description: '' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.monthlyAmount) {
      setError('Nombre y monto son requeridos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        name: form.name.trim(),
        monthlyAmount: Number(form.monthlyAmount),
        durationMonths: Number(form.durationMonths) || 6,
      };
      if (form.description) payload.description = form.description;
      if (plan) {
        await api.sponsors.plans.update(plan.id, payload);
      } else {
        if (!sponsor?.id) {
          throw new Error('Falta el auspiciante para crear el plan');
        }
        await api.sponsors.plans.create(sponsor.id, {
          sponsorId: sponsor.id,
          ...payload,
          active: true,
        });
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre del plan *</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Ej: Plan Oro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto mensual ($) *</Label>
              <Input
                type="number"
                value={form.monthlyAmount}
                onChange={set('monthlyAmount')}
                placeholder="50000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duración (meses)</Label>
              <Input
                type="number"
                value={form.durationMonths}
                onChange={set('durationMonths')}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input
              value={form.description}
              onChange={set('description')}
              placeholder="Descripción del plan"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
