'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Newspaper, Plus, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

function NewsForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);

  return (
    <Card className="bg-muted/40">
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm font-semibold">{initial ? 'Editar noticia' : 'Nueva noticia'}</p>
        <div className="space-y-1.5">
          <Label>Título *</Label>
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Contenido *</Label>
          <Textarea placeholder="Contenido" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </div>
        <div className="space-y-1.5">
          <Label>URL de imagen (opcional)</Label>
          <Input
            placeholder="URL de imagen"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-brand-red"
          />
          Publicar ahora
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!title || !body) return;
              onSave({ title, body, imageUrl: imageUrl || undefined, published });
            }}
          >
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClubNewsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['club-news'],
    queryFn: () => api.club.news.list(),
  });
  const news = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.news.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-news'] });
      setShowForm(false);
      toast.success('Noticia creada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.club.news.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-news'] });
      setEditing(null);
      toast.success('Noticia actualizada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.news.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-news'] });
      toast.success('Noticia eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, published }: any) => api.club.news.update(id, { published: !published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-news'] }),
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="text-brand-red" size={24} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Noticias del Club</h1>
            <p className="text-sm text-muted-foreground">
              {news.length} noticias — {news.filter((n: any) => n.published).length} publicadas
            </p>
          </div>
        </div>
        {!showForm && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Nueva noticia
          </Button>
        )}
      </div>

      {showForm && <NewsForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay noticias todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item: any) => (
            <div key={item.id}>
              {editing?.id === item.id ? (
                <NewsForm
                  initial={item}
                  onSave={(d) => updateMutation.mutate({ id: item.id, ...d })}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-start gap-3 pt-6">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant={item.published ? 'success' : 'neutral'} className="rounded-full">
                          {item.published ? 'Publicada' : 'Borrador'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-brand-blue"
                        onClick={() => toggleMutation.mutate({ id: item.id, published: item.published })}
                        title={item.published ? 'Despublicar' : 'Publicar'}
                        aria-label={item.published ? 'Despublicar noticia' : 'Publicar noticia'}
                      >
                        {item.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-blue" onClick={() => setEditing(item)} aria-label="Editar noticia">
                        <Edit2 size={15} />
                      </Button>
                      <ConfirmDialog
                        title="Eliminar noticia"
                        description={`¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => deleteMutation.mutate(item.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Eliminar noticia">
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
