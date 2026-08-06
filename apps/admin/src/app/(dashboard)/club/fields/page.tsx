'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { MapPin, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

const SURFACES = ['Césped natural', 'Césped sintético', 'Tierra', 'Cemento', 'Parquet', 'Otro'];

function FieldForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [mapUrl, setMapUrl] = useState(initial?.mapUrl ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '');
  const [surface, setSurface] = useState(initial?.surface ?? 'none');

  return (
    <Card className="bg-muted/40">
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm font-semibold">{initial ? 'Editar cancha' : 'Nueva cancha'}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de superficie</Label>
            <Select value={surface} onValueChange={setSurface}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de superficie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin superficie</SelectItem>
                {SURFACES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" />
          </div>
          <div className="space-y-1.5">
            <Label>Capacidad (personas)</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Capacidad"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps URL</Label>
            <Input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="Google Maps URL" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!name) return;
              onSave({
                name,
                address: address || undefined,
                mapUrl: mapUrl || undefined,
                capacity: capacity ? parseInt(capacity) : undefined,
                surface: surface === 'none' ? undefined : surface,
              });
            }}
          >
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClubFieldsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['club-fields'],
    queryFn: () => api.club.fields.list(),
  });
  const fields = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.fields.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-fields'] });
      setShowForm(false);
      toast.success('Cancha creada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.club.fields.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-fields'] });
      setEditing(null);
      toast.success('Cancha actualizada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.fields.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-fields'] });
      toast.success('Cancha eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="text-brand-red" size={24} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Canchas / Sedes</h1>
            <p className="text-sm text-muted-foreground">{fields.length} canchas registradas</p>
          </div>
        </div>
        {!showForm && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Nueva cancha
          </Button>
        )}
      </div>

      {showForm && <FieldForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : fields.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay canchas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field: any) => (
            <div key={field.id}>
              {editing?.id === field.id ? (
                <FieldForm
                  initial={field}
                  onSave={(d) => updateMutation.mutate({ id: field.id, ...d })}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-navy/10">
                      <MapPin size={18} className="text-brand-navy" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{field.name}</p>
                        {field.surface && (
                          <Badge variant="secondary" className="rounded-full text-xs font-normal">
                            {field.surface}
                          </Badge>
                        )}
                        {field.capacity && (
                          <span className="text-xs text-muted-foreground">
                            {field.capacity.toLocaleString()} personas
                          </span>
                        )}
                      </div>
                      {field.address && <p className="mt-0.5 text-sm text-muted-foreground">{field.address}</p>}
                      {field.mapUrl && (
                        <a
                          href={field.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
                        >
                          <ExternalLink size={11} /> Ver en Google Maps
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-blue" onClick={() => setEditing(field)} aria-label="Editar cancha">
                        <Edit2 size={15} />
                      </Button>
                      <ConfirmDialog
                        title="Eliminar cancha"
                        description={`¿Eliminar "${field.name}"? Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => deleteMutation.mutate(field.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Eliminar cancha">
                            <Trash2 size={15} />
                          </Button>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
