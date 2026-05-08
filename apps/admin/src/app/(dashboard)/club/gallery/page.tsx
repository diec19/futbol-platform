'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Image, Plus, Trash2, X } from 'lucide-react';

export default function ClubGalleryPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['club-gallery'], queryFn: () => api.club.gallery.list() });
  const photos = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (d: unknown) => api.club.gallery.add(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-gallery'] }); setShowForm(false); setUrl(''); setCaption(''); setPreview(null); },
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.club.gallery.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-gallery'] }),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Galería</h1>
            <p className="text-sm text-slate-500">{photos.length} fotos</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Agregar foto
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="font-semibold text-sm text-slate-700">Agregar foto</p>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
            placeholder="URL de la imagen *"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setPreview(e.target.value || null); }}
          />
          {preview && (
            <div className="relative inline-block">
              <img src={preview} alt="preview" className="h-40 w-auto rounded-lg object-cover border border-slate-200" onError={() => setPreview(null)} />
              <button onClick={() => { setPreview(null); setUrl(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                <X size={12} />
              </button>
            </div>
          )}
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
            placeholder="Descripción (opcional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setUrl(''); setCaption(''); setPreview(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button
              onClick={() => { if (!url) return; addMutation.mutate({ url, caption: caption || undefined }); }}
              className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Image size={40} className="mx-auto mb-3 opacity-30" />
          <p>La galería está vacía</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo: any) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                  {photo.caption}
                </div>
              )}
              <button
                onClick={() => removeMutation.mutate(photo.id)}
                className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
