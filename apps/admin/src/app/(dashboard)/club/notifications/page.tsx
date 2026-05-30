'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bell, Plus, X, Trash2, Globe, User, CheckCheck } from 'lucide-react';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ memberId: '', title: '', message: '', type: 'global' });
  const [memberSearch, setMemberSearch] = useState('');

  const { data: notifsRes, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  });
  const { data: membersRes } = useQuery({
    queryKey: ['members-all'],
    queryFn: () => api.members.list(),
    enabled: showForm,
  });

  const notifications = notifsRes?.data ?? [];
  const members = membersRes?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => api.notifications.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setShowForm(false);
      setForm({ memberId: '', title: '', message: '', type: 'global' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.notifications.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const filteredMembers = members.filter((m: any) =>
    m.fullName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.dni?.includes(memberSearch)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notificaciones</h1>
          <p className="text-sm text-slate-500 mt-1">Gestioná las notificaciones para los socios</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red-dark text-sm font-medium"
        >
          <Plus size={16} /> Nueva notificación
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Bell size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay notificaciones enviadas</p>
          <p className="text-sm mt-1">Creá la primera notificación para tus socios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className={`p-2 rounded-full flex-shrink-0 ${n.type === 'global' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                {n.type === 'global' ? <Globe size={16} className="text-blue-600" /> : <User size={16} className="text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{n.title}</p>
                  {n.read && <CheckCheck size={14} className="text-green-500" />}
                </div>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{formatDate(n.createdAt)}</span>
                  <span className={`px-2 py-0.5 rounded ${n.type === 'global' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {n.type === 'global' ? 'Global' : 'Personal'}
                  </span>
                  {n.member && <span>Para: {n.member.fullName}</span>}
                </div>
              </div>
              <button
                onClick={() => { if (confirm('¿Eliminar notificación?')) deleteMutation.mutate(n.id); }}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <p className="font-bold text-slate-800">Nueva notificación</p>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => set('type', 'global')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === 'global' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Globe size={14} /> Global (todos)
                  </button>
                  <button
                    onClick={() => set('type', 'personal')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === 'personal' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <User size={14} /> Personal
                  </button>
                </div>
              </div>

              {form.type === 'personal' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Buscar socio</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-red mb-2"
                    placeholder="Nombre o DNI..."
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                  <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-1">
                    {filteredMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">Sin resultados</p>
                    ) : (
                      filteredMembers.map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => { set('memberId', m.id); setMemberSearch(m.fullName); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${form.memberId === m.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          {m.fullName} {m.dni ? `- ${m.dni}` : ''}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Título</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-red"
                  placeholder="Ej: Recordatorio de cuota"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mensaje</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-red resize-none"
                  rows={4}
                  placeholder="Escribí el mensaje de la notificación..."
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button
                onClick={() => {
                  if (!form.title || !form.message) return;
                  if (form.type === 'personal' && !form.memberId) return;
                  createMutation.mutate({
                    title: form.title,
                    message: form.message,
                    type: form.type,
                    memberId: form.type === 'personal' ? form.memberId : undefined,
                  });
                }}
                className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
              >Enviar notificación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
