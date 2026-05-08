'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Newspaper, Plus, Trash2, Eye, EyeOff, X, Edit2 } from 'lucide-react';

function NewsForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
      <p className="font-semibold text-sm text-slate-700">{initial ? 'Editar noticia' : 'Nueva noticia'}</p>
      <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red min-h-[120px] resize-none" placeholder="Contenido *" value={body} onChange={(e) => setBody(e.target.value)} />
      <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="URL de imagen (opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-brand-red" />
        Publicar ahora
      </label>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
        <button
          onClick={() => { if (!title || !body) return; onSave({ title, body, imageUrl: imageUrl || undefined, published }); }}
          className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default function ClubNewsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['club-news'], queryFn: () => api.club.news.list() });
  const news = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.news.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-news'] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.club.news.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-news'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.news.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-news'] }),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, published }: any) => api.club.news.update(id, { published: !published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-news'] }),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Noticias del Club</h1>
            <p className="text-sm text-slate-500">{news.length} noticias — {news.filter((n: any) => n.published).length} publicadas</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Nueva noticia
          </button>
        )}
      </div>

      {showForm && <NewsForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : news.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
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
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.published ? 'Publicada' : 'Borrador'}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('es-AR')}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{item.body}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleMutation.mutate({ id: item.id, published: item.published })} title={item.published ? 'Despublicar' : 'Publicar'} className="p-1.5 text-slate-400 hover:text-brand-blue rounded">
                        {item.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => setEditing(item)} className="p-1.5 text-slate-400 hover:text-brand-blue rounded">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
