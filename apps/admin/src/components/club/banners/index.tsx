'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Pause, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { BannerModal } from './banner-modal';

export default function BannersPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.sponsors.list(),
  });

  // Solo auspiciantes que tienen imagen de banner (slideUrl) son banners del home.
  const banners = (data?.data ?? []).filter((s: any) => !!s.slideUrl);

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.sponsors.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.sponsors.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Banner eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSaved = () => {
    setShowNew(false);
    setEditBanner(null);
    qc.invalidateQueries({ queryKey: ['sponsors'] });
    toast.success('Banner guardado');
  };

  return (
    <div className="space-y-6">
      {(showNew || editBanner) && (
        <BannerModal
          sponsor={editBanner}
          onClose={() => { setShowNew(false); setEditBanner(null); }}
          onSaved={onSaved}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Los banners publicitarios aparecen en el inicio de la app de socios
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Nuevo banner
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="space-y-3 p-12 text-center">
          <ImageIcon size={40} className="mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No hay banners cargados</p>
          <p className="text-sm text-muted-foreground/70">
            Subí una imagen para mostrar publicidad en el inicio de la app
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner: any) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="h-28 w-full overflow-hidden rounded-lg border sm:w-48">
                  <img
                    src={banner.slideUrl}
                    alt={banner.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{banner.name}</h3>
                    <Badge
                      variant={banner.active ? 'success' : 'warning'}
                      className="rounded-full text-xs"
                    >
                      {banner.active ? 'Activo' : 'Pausado'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Orden: {banner.slideOrder ?? '—'}
                    {banner.website ? ` · ${banner.website}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {banner.active
                      ? 'Visible en el inicio de la app'
                      : 'Oculto hasta activarlo'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditBanner(banner)}
                    title="Editar"
                    aria-label="Editar banner"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                    onClick={() => toggleMutation.mutate(banner.id)}
                    title={banner.active ? 'Pausar' : 'Activar'}
                    aria-label={banner.active ? 'Pausar banner' : 'Activar banner'}
                  >
                    <Pause size={14} />
                  </Button>
                  <ConfirmDialog
                    title="Eliminar banner"
                    description={`¿Eliminar el banner "${banner.name}"? Esta acción no se puede deshacer.`}
                    confirmLabel="Eliminar"
                    destructive
                    onConfirm={() => removeMutation.mutate(banner.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Eliminar banner">
                        <Trash2 size={14} />
                      </Button>
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
