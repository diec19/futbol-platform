'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewTournamentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    sponsor: '',
    rules: '',
    status: 'DRAFT',
  });

  const create = useMutation({
    mutationFn: () =>
      api.tournaments.create({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        description: form.description || undefined,
        sponsor: form.sponsor || undefined,
        rules: form.rules || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Torneo creado correctamente');
      router.push('/tournaments');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tournaments" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Torneo</h1>
          <p className="text-sm text-muted-foreground">Completá los datos del torneo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del torneo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              value={form.name}
              onChange={set('name')}
              required
              placeholder="Torneo Apertura 2026"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Descripción del torneo..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha inicio *</Label>
              <Input type="date" value={form.startDate} onChange={set('startDate')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha fin *</Label>
              <Input type="date" value={form.endDate} onChange={set('endDate')} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                  <SelectItem value="FINISHED">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sponsor</Label>
              <Input
                value={form.sponsor}
                onChange={set('sponsor')}
                placeholder="Nombre del sponsor"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reglamento</Label>
            <Textarea
              value={form.rules}
              onChange={set('rules')}
              rows={5}
              placeholder="Reglamento del torneo..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" asChild>
              <Link href="/tournaments">Cancelar</Link>
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.name || !form.startDate || !form.endDate}
            >
              {create.isPending ? 'Guardando...' : 'Crear torneo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
