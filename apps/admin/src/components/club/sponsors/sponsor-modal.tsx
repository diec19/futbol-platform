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

export function SponsorModal({
  sponsor,
  onClose,
  onSaved,
}: {
  sponsor?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    sponsor
      ? {
          name: sponsor.name,
          contactName: sponsor.contactName ?? '',
          phone: sponsor.phone ?? '',
          email: sponsor.email ?? '',
          logoUrl: sponsor.logoUrl ?? '',
          website: sponsor.website ?? '',
          slideUrl: sponsor.slideUrl ?? '',
          slideOrder: sponsor.slideOrder != null ? String(sponsor.slideOrder) : '',
        }
      : {
          name: '',
          contactName: '',
          phone: '',
          email: '',
          logoUrl: '',
          website: '',
          slideUrl: '',
          slideOrder: '',
        }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = { name: form.name.trim() };
      if (form.contactName) payload.contactName = form.contactName;
      if (form.phone) payload.phone = form.phone;
      if (form.email) payload.email = form.email;
      if (form.logoUrl) payload.logoUrl = form.logoUrl;
      if (form.website) payload.website = form.website;
      if (form.slideUrl) payload.slideUrl = form.slideUrl;
      if (form.slideOrder) payload.slideOrder = parseInt(form.slideOrder);
      if (sponsor) {
        await api.sponsors.update(sponsor.id, payload);
      } else {
        await api.sponsors.create(payload);
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
          <DialogTitle>
            {sponsor ? 'Editar auspiciante' : 'Nuevo auspiciante'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Ej: Coca-Cola" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Input
                value={form.contactName}
                onChange={set('contactName')}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={set('phone')} placeholder="11-1234-5678" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={set('email')}
              type="email"
              placeholder="contacto@coca-cola.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Sitio web</Label>
            <Input value={form.website} onChange={set('website')} placeholder="https://..." />
          </div>

          <div className="space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Carrusel del Home (app mobile)
            </p>
            <div className="space-y-1.5">
              <Label>Imagen del slide (URL JPG/PNG)</Label>
              <Input
                value={form.slideUrl}
                onChange={set('slideUrl')}
                placeholder="https://...imagen-slide.jpg"
              />
              {form.slideUrl && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={form.slideUrl}
                    alt="Preview slide"
                    className="h-24 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Orden del carrusel (opcional)</Label>
              <Input
                type="number"
                value={form.slideOrder}
                onChange={set('slideOrder')}
                placeholder="1 = primero"
              />
            </div>
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
