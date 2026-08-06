'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/validations';
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
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      birthYear: '',
      minAge: '',
      maxAge: '',
      maxPlayers: '22',
      phaseType: 'MIXED',
      rules: '',
    },
  });

  const create = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      api.categories.create({
        tournamentId,
        name: values.name,
        birthYear: values.birthYear ? Number(values.birthYear) : undefined,
        minAge: values.minAge ? Number(values.minAge) : undefined,
        maxAge: values.maxAge ? Number(values.maxAge) : undefined,
        maxPlayers: Number(values.maxPlayers),
        phaseType: values.phaseType,
        rules: values.rules || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Categoría creada correctamente');
      router.push(`/tournaments/${tournamentId}/categories/${res.data.id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      await create.mutateAsync(values);
    } catch {
      // El toast de error lo maneja onError del mutation
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Volver al torneo"
        >
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Nombre *</Label>
              <Input
                id="category-name"
                placeholder="Ej: Sub 13, Primera División, Femenino"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category-birthYear">Año de nacimiento</Label>
                <Input
                  id="category-birthYear"
                  type="number"
                  placeholder="2013"
                  {...register('birthYear')}
                />
                {errors.birthYear && (
                  <p className="text-sm text-destructive">{errors.birthYear.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-minAge">Edad mín.</Label>
                <Input
                  id="category-minAge"
                  type="number"
                  placeholder="10"
                  {...register('minAge')}
                />
                {errors.minAge && (
                  <p className="text-sm text-destructive">{errors.minAge.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-maxAge">Edad máx.</Label>
                <Input
                  id="category-maxAge"
                  type="number"
                  placeholder="13"
                  {...register('maxAge')}
                />
                {errors.maxAge && (
                  <p className="text-sm text-destructive">{errors.maxAge.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category-maxPlayers">Jugadores por equipo</Label>
                <Input
                  id="category-maxPlayers"
                  type="number"
                  {...register('maxPlayers')}
                  aria-invalid={!!errors.maxPlayers}
                />
                {errors.maxPlayers && (
                  <p className="text-sm text-destructive">{errors.maxPlayers.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-phase">Tipo de fase</Label>
                <Controller
                  control={control}
                  name="phaseType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category-phase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MIXED">Mixto (grupos + eliminación)</SelectItem>
                        <SelectItem value="GROUP">Solo grupos</SelectItem>
                        <SelectItem value="KNOCKOUT">Solo eliminación directa</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-rules">Reglamento específico</Label>
              <Textarea
                id="category-rules"
                rows={3}
                placeholder="Reglamento particular de esta categoría..."
                {...register('rules')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" asChild type="button">
                <Link href={`/tournaments/${tournamentId}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear categoría'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
