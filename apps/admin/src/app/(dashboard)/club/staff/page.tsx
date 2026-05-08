'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';

const ROLES = ['Director Técnico', 'Ayudante de Campo', 'Preparador Físico', 'Preparador de Arqueros', 'Médico', 'Kinesiólogo', 'Utilero', 'Coordinador', 'Presidente', 'Secretario', 'Tesorero', 'Vocal'];

function StaffForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [photo, setPhoto] = useState(initial?.photo ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
      <p className="font-semibold text-sm text-slate-700">{initial ? 'Editar integrante' : 'Agregar integrante'}</p>
      <div className="grid grid-cols-2 gap-3">
        <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Nombre completo *" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Seleccionar rol *</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          <option value="__custom">Otro...</option>
        </select>
        {role === '__custom' && (
          <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red col-span-2" placeholder="Rol personalizado" onChange={(e) => setRole(e.target.value)} />
        )}
        <input className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="URL de foto (opcional)" value={photo} onChange={(e) => setPhoto(e.target.value)} />
        <textarea className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red resize-none min-h-[80px]" placeholder="Descripción breve (opcional)" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
        <button
          onClick={() => { if (!name || !role || role === '__custom') return; onSave({ name, role, photo: photo || undefined, bio: bio || undefined }); }}
          className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default function ClubStaffPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['club-staff'], queryFn: () => api.club.staff.list() });
  const staff = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.staff.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-staff'] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.club.staff.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-staff'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.staff.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-staff'] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cuerpo Técnico</h1>
            <p className="text-sm text-slate-500">{staff.length} integrantes</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Agregar
          </button>
        )}
      </div>

      {showForm && <StaffForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : staff.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay integrantes cargados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member: any) => (
            <div key={member.id}>
              {editing?.id === member.id ? (
                <StaffForm initial={member} onSave={(d) => updateMutation.mutate({ id: member.id, ...d })} onCancel={() => setEditing(null)} />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {member.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-brand-red font-medium">{member.role}</p>
                    {member.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{member.bio}</p>}
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => setEditing(member)} className="p-1 text-slate-400 hover:text-brand-blue rounded">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(member.id)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                        <Trash2 size={13} />
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
