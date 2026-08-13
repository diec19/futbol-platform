'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

const ROLES = [
  'Director Técnico',
  'Ayudante de Campo',
  'Preparador Físico',
  'Preparador de Arqueros',
  'Médico',
  'Kinesiólogo',
  'Utilero',
  'Coordinador',
  'Presidente',
  'Secretario',
  'Tesorero',
  'Vocal',
];

function StaffForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [photo, setPhoto] = useState(initial?.photo ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');

  return (
    <Card className="bg-muted/40">
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm font-semibold">{initial ? 'Editar integrante' : 'Agregar integrante'}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nombre completo *</Label>
            <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Rol *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
                <SelectItem value="__custom">Otro...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === '__custom' && (
            <div className="col-span-2 space-y-1.5">
              <Label>Rol personalizado</Label>
              <Input placeholder="Rol personalizado" onChange={(e) => setRole(e.target.value)} />
            </div>
          )}
          <div className="col-span-2 space-y-1.5">
            <Label>URL de foto (opcional)</Label>
            <Input placeholder="URL de foto" value={photo} onChange={(e) => setPhoto(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Descripción breve (opcional)</Label>
            <Textarea
              placeholder="Descripción breve"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!name || !role || role === '__custom') return;
              onSave({ name, role, photo: photo || undefined, bio: bio || undefined });
            }}
          >
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClubStaffPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['club-staff'],
    queryFn: () => api.club.staff.list(),
  });
  const staff = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.staff.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-staff'] });
      setShowForm(false);
      toast.success('Integrante agregado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.club.staff.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-staff'] });
      setEditing(null);
      toast.success('Integrante actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.staff.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-staff'] });
      toast.success('Integrante eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-brand-red" size={24} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cuerpo Técnico</h1>
            <p className="text-sm text-muted-foreground">{staff.length} integrantes</p>
          </div>
        </div>
        {!showForm && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Agregar
          </Button>
        )}
      </div>

      {showForm && <StaffForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay integrantes cargados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member: any) => (
            <div key={member.id}>
              {editing?.id === member.id ? (
                <StaffForm
                  initial={member}
                  onSave={(d) => updateMutation.mutate({ id: member.id, ...d })}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <Card>
                  <CardContent className="flex gap-4 pt-6">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-lg font-bold text-white">
                        {member.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.name}</p>
                      <p className="text-xs font-medium text-brand-red">{member.role}</p>
                      {member.bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{member.bio}</p>}
                      <div className="mt-2 flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-brand-blue" onClick={() => setEditing(member)} aria-label="Editar integrante">
                          <Edit2 size={13} />
                        </Button>
                        <ConfirmDialog
                          title="Eliminar integrante"
                          description={`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`}
                          confirmLabel="Eliminar"
                          destructive
                          onConfirm={() => deleteMutation.mutate(member.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label="Eliminar integrante">
                              <Trash2 size={13} />
                            </Button>
                          }
                        />
                      </div>
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
