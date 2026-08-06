'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  tournamentFormSchema,
  type TournamentFormValues,
} from '@/lib/validations';
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
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      sponsor: '',
      rules: '',
      status: 'DRAFT',
    },
  });

  const create = useMutation({
    mutationFn: (values: TournamentFormValues) =>
      api.tournaments.create({
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        description: values.description || undefined,
        sponsor: values.sponsor || undefined,
        rules: values.rules || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Torneo creado correctamente');
      router.push('/tournaments');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = async (values: TournamentFormValues) => {
    try {
      await create.mutateAsync(values);
    } catch {
      // El toast de error lo maneja onError del mutation
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tournaments" className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Volver a torneos">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="tournament-name">Nombre *</Label>
              <Input
                id="tournament-name"
                placeholder="Torneo Apertura 2026"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tournament-description">Descripción</Label>
              <Textarea
                id="tournament-description"
                rows={3}
                placeholder="Descripción del torneo..."
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tournament-start">Fecha inicio *</Label>
                <Input
                  id="tournament-start"
                  type="date"
                  {...register('startDate')}
                  aria-invalid={!!errors.startDate}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tournament-end">Fecha fin *</Label>
                <Input
                  id="tournament-end"
                  type="date"
                  {...register('endDate')}
                  aria-invalid={!!errors.endDate}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tournament-status">Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tournament-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Borrador</SelectItem>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                        <SelectItem value="FINISHED">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tournament-sponsor">Sponsor</Label>
                <Input
                  id="tournament-sponsor"
                  placeholder="Nombre del sponsor"
                  {...register('sponsor')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tournament-rules">Reglamento</Label>
              <Textarea
                id="tournament-rules"
                rows={5}
                placeholder="Reglamento del torneo..."
                {...register('rules')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" asChild type="button">
                <Link href="/tournaments">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Crear torneo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
