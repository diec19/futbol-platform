'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewCategoryPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    birthYear: '',
    minAge: '',
    maxAge: '',
    maxPlayers: '22',
    phaseType: 'MIXED',
    rules: '',
  });

  const create = useMutation({
    mutationFn: () =>
      api.categories.create({
        tournamentId,
        name: form.name,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        minAge: form.minAge ? Number(form.minAge) : undefined,
        maxAge: form.maxAge ? Number(form.maxAge) : undefined,
        maxPlayers: Number(form.maxPlayers),
        phaseType: form.phaseType,
        rules: form.rules || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Categoría creada correctamente');
      router.push(`/tournaments/${tournamentId}/categories/${res.data.id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${tournamentId}`} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Categoría</h1>
          <p className="text-sm text-muted-foreground">Se agregará al torneo actual</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={set('name')}
              required
              placeholder="Ej: Sub 13, Primera División, Femenino"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Año de nacimiento</Label>
              <Input type="number" value={form.birthYear} onChange={set('birthYear')} placeholder="2013" />
            </div>
            <div className="space-y-1.5">
              <Label>Edad mín.</Label>
              <Input type="number" value={form.minAge} onChange={set('minAge')} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <Label>Edad máx.</Label>
              <Input type="number" value={form.maxAge} onChange={set('maxAge')} placeholder="13" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jugadores por equipo</Label>
              <Input type="number" value={form.maxPlayers} onChange={set('maxPlayers')} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de fase</Label>
              <Select value={form.phaseType} onValueChange={(v) => setForm(f => ({ ...f, phaseType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIXED">Mixto (grupos + eliminación)</SelectItem>
                  <SelectItem value="GROUP">Solo grupos</SelectItem>
                  <SelectItem value="KNOCKOUT">Solo eliminación directa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reglamento específico</Label>
            <Textarea
              value={form.rules}
              onChange={set('rules')}
              rows={3}
              placeholder="Reglamento particular de esta categoría..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" asChild>
              <Link href={`/tournaments/${tournamentId}`}>Cancelar</Link>
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.name}
            >
              {create.isPending ? 'Creando...' : 'Crear categoría'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
