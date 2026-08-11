'use client';

import { useState, useRef } from 'react';
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
import { ImagePlus, Trash2 } from 'lucide-react';

export function BannerModal({
  sponsor,
  onClose,
  onSaved,
}: {
  sponsor?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(
    sponsor
      ? {
          name: sponsor.name,
          website: sponsor.website ?? '',
          slideUrl: sponsor.slideUrl ?? '',
          slideOrder: sponsor.slideOrder != null ? String(sponsor.slideOrder) : '',
        }
      : {
          name: '',
          website: '',
          slideUrl: '',
          slideOrder: '',
        }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, slideUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!form.slideUrl) {
      setError('Subí una imagen para el banner');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        name: form.name.trim(),
        slideUrl: form.slideUrl,
      };
      if (form.website) payload.website = form.website;
      if (form.slideOrder) payload.slideOrder = parseInt(form.slideOrder);
      if (sponsor) {
        await api.sponsors.update(sponsor.id, payload);
      } else {
        await api.sponsors.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sponsor ? 'Editar banner' : 'Nuevo banner'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={set('name')}
              placeholder="Ej: Coca-Cola"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Imagen del banner *</Label>
            {form.slideUrl ? (
              <div className="relative overflow-hidden rounded-lg border">
                <img
                  src={form.slideUrl}
                  alt="Preview banner"
                  className="h-36 w-full object-cover"
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, slideUrl: '' }))}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  aria-label="Quitar imagen"
                  title="Quitar imagen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground hover:bg-muted/60"
              >
                <ImagePlus size={24} />
                <span className="text-sm">Subir imagen (JPG/PNG, máx 5 MB)</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sitio web (opcional)</Label>
              <Input
                value={form.website}
                onChange={set('website')}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Orden (opcional)</Label>
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
