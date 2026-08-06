'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Image, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

export default function ClubGalleryPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['club-gallery'],
    queryFn: () => api.club.gallery.list(),
  });
  const photos = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (d: unknown) => api.club.gallery.add(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-gallery'] });
      setShowForm(false);
      setUrl('');
      setCaption('');
      setPreview(null);
      toast.success('Foto agregada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.club.gallery.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-gallery'] });
      toast.success('Foto eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image className="text-brand-red" size={24} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Galería</h1>
            <p className="text-sm text-muted-foreground">{photos.length} fotos</p>
          </div>
        </div>
        {!showForm && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Agregar foto
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="bg-muted/40">
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm font-semibold">Agregar foto</p>
            <div className="space-y-1.5">
              <Label>URL de la imagen *</Label>
              <Input
                placeholder="URL de la imagen"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreview(e.target.value || null);
                }}
              />
            </div>
            {preview && (
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="preview"
                  className="h-40 w-auto rounded-lg border object-cover"
                  onError={() => setPreview(null)}
                />
                <Button
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setPreview(null);
                    setUrl('');
                  }}
                >
                  <X size={12} />
                </Button>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descripción" />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setUrl('');
                  setCaption('');
                  setPreview(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!url) return;
                  addMutation.mutate({ url, caption: caption || undefined });
                }}
              >
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Image size={40} className="mx-auto mb-3 opacity-30" />
          <p>La galería está vacía</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo: any) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
            >
              <img src={photo.url} alt={photo.caption ?? ''} className="h-full w-full object-cover" />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-xs text-white">
                  {photo.caption}
                </div>
              )}
              <ConfirmDialog
                title="Eliminar foto"
                description="¿Eliminar esta foto de la galería? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                destructive
                onConfirm={() => removeMutation.mutate(photo.id)}
                trigger={
                  <Button
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 rounded-full transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
