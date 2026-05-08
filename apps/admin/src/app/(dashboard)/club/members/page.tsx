'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Users, Plus, X, Edit2, Trash2, Link2, Unlink, CreditCard,
  CheckCircle, Clock, AlertCircle, Send, Copy, MessageCircle,
  ChevronRight, Eye, EyeOff,
} from 'lucide-react';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const SUB_STATUS = {
  PENDING:   { label: 'Pendiente',   color: 'bg-slate-100 text-slate-600',  icon: Clock },
  LINK_SENT: { label: 'Link enviado', color: 'bg-blue-100 text-blue-700',   icon: Send },
  PAID:      { label: 'Pagado',       color: 'bg-green-100 text-green-700', icon: CheckCircle },
  OVERDUE:   { label: 'Vencido',      color: 'bg-red-100 text-red-700',     icon: AlertCircle },
};

// ── Formulario de creación ────────────────────────────────────────────────────
function MemberForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ fullName: '', dni: '', email: '', phone: '', username: '', password: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <p className="font-bold text-slate-800">Nuevo Socio</p>
          <button onClick={onCancel}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="input col-span-2" placeholder="Nombre completo *" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
            <input className="input" placeholder="DNI *" value={form.dni} onChange={e => set('dni', e.target.value)} />
            <input className="input" placeholder="Teléfono" value={form.phone} onChange={e => set('phone', e.target.value)} />
            <input className="input col-span-2" placeholder="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            <input className="input" placeholder="Usuario *" value={form.username} onChange={e => set('username', e.target.value)} />
            <div className="relative">
              <input className="input pr-10 w-full" placeholder="Contraseña *" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end p-5 pt-0">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button
            onClick={() => { if (!form.fullName || !form.dni || !form.email || !form.username || !form.password) return; onSave(form); }}
            className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
          >Crear socio</button>
        </div>
      </div>
      <style jsx>{`.input { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; width: 100%; } .input:focus { border-color: #DC2626; }`}</style>
    </div>
  );
}

// ── Panel lateral del socio ───────────────────────────────────────────────────
function MemberPanel({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'data' | 'players' | 'subs'>('subs');
  const [copied, setCopied] = useState<string | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: '', dueDate: '' });

  const { data, isLoading } = useQuery({ queryKey: ['member', memberId], queryFn: () => api.members.get(memberId) });
  const { data: allPlayers } = useQuery({ queryKey: ['players-all'], queryFn: () => api.players.list({ limit: '200' }) });
  const member = data?.data;
  const players = allPlayers?.data ?? [];
  const linkedIds = new Set(member?.players?.map((mp: any) => mp.player.id) ?? []);

  const linkMutation = useMutation({ mutationFn: (playerId: string) => api.members.linkPlayer(memberId, playerId), onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }) });
  const unlinkMutation = useMutation({ mutationFn: (playerId: string) => api.members.unlinkPlayer(memberId, playerId), onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }) });
  const createSubMutation = useMutation({
    mutationFn: (d: any) => api.members.subscriptions.create(memberId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['member', memberId] }); setShowSubForm(false); },
  });
  const sendLinkMutation = useMutation({ mutationFn: (subId: string) => api.members.subscriptions.sendLink(subId), onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }) });
  const markPaidMutation = useMutation({ mutationFn: (subId: string) => api.members.subscriptions.markPaid(subId), onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }) });
  const deleteSubMutation = useMutation({ mutationFn: (subId: string) => api.members.subscriptions.remove(subId), onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }) });

  const copyLink = (link: string, id: string) => { navigator.clipboard.writeText(link); setCopied(id); setTimeout(() => setCopied(null), 2000); };
  const whatsappLink = (phone: string, link: string, name: string, month: number, year: number) => {
    const msg = encodeURIComponent(`Hola ${name}! 👋 Te enviamos el link para pagar la cuota de ${MONTHS_FULL[month - 1]} ${year}: ${link}`);
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`;
  };

  if (isLoading) return null;

  const tabs = [
    { id: 'subs', label: 'Cuotas' },
    { id: 'players', label: 'Hijos' },
    { id: 'data', label: 'Datos' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-40">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold flex-shrink-0">
            {member?.fullName?.[0]}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800">{member?.fullName}</p>
            <p className="text-xs text-slate-500">{member?.email} · @{member?.username}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-brand-red border-b-2 border-brand-red' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Cuotas ── */}
          {tab === 'subs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Historial de cuotas</p>
                <button onClick={() => setShowSubForm(v => !v)} className="flex items-center gap-1 text-xs text-brand-red hover:underline">
                  <Plus size={13} /> Agregar cuota
                </button>
              </div>

              {showSubForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={subForm.month} onChange={e => setSubForm(f => ({ ...f, month: +e.target.value }))}>
                      {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm" type="number" placeholder="Año" value={subForm.year} onChange={e => setSubForm(f => ({ ...f, year: +e.target.value }))} />
                    <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm" type="number" placeholder="Monto $" value={subForm.amount} onChange={e => setSubForm(f => ({ ...f, amount: e.target.value }))} />
                    <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm" type="date" placeholder="Vencimiento" value={subForm.dueDate} onChange={e => setSubForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowSubForm(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
                    <button
                      onClick={() => { if (!subForm.amount || !subForm.dueDate) return; createSubMutation.mutate({ month: subForm.month, year: subForm.year, amount: +subForm.amount, dueDate: subForm.dueDate }); }}
                      disabled={createSubMutation.isPending}
                      className="px-3 py-1.5 bg-brand-red text-white rounded-lg text-sm hover:bg-brand-red-dark"
                    >Crear</button>
                  </div>
                </div>
              )}

              {member?.subscriptions?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Sin cuotas registradas</p>
              ) : (
                member?.subscriptions?.map((sub: any) => {
                  const cfg = SUB_STATUS[sub.status as keyof typeof SUB_STATUS];
                  const Icon = cfg?.icon ?? Clock;
                  return (
                    <div key={sub.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{MONTHS_FULL[sub.month - 1]} {sub.year}</p>
                          <p className="text-sm text-slate-500">${sub.amount.toLocaleString('es-AR')} · vence {new Date(sub.dueDate).toLocaleDateString('es-AR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg?.color}`}>
                            <Icon size={11} />{cfg?.label}
                          </span>
                          <button onClick={() => deleteSubMutation.mutate(sub.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
                        </div>
                      </div>

                      {/* Link MP */}
                      {sub.mpPaymentLink && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-slate-500 truncate">{sub.mpPaymentLink}</p>
                          <div className="flex gap-2">
                            <button onClick={() => copyLink(sub.mpPaymentLink, sub.id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                              <Copy size={11} /> {copied === sub.id ? '¡Copiado!' : 'Copiar link'}
                            </button>
                            {member.phone && (
                              <a href={whatsappLink(member.phone, sub.mpPaymentLink, member.fullName, sub.month, sub.year)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                <MessageCircle size={11} /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {sub.status !== 'PAID' && (
                          <>
                            <button
                              onClick={() => sendLinkMutation.mutate(sub.id)}
                              disabled={sendLinkMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark disabled:opacity-50"
                            >
                              <Send size={12} /> {sub.mpPaymentLink ? 'Regenerar link MP' : 'Generar link MP'}
                            </button>
                            <button
                              onClick={() => markPaidMutation.mutate(sub.id)}
                              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              <CheckCircle size={12} /> Marcar pagado
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Hijos ── */}
          {tab === 'players' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Jugadores vinculados</p>
              {member?.players?.map((mp: any) => (
                <div key={mp.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {mp.player.fullName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{mp.player.fullName}</p>
                    <p className="text-xs text-slate-500">{mp.player.team?.category?.name} · {mp.player.team?.name}{mp.player.shirtNumber ? ` · #${mp.player.shirtNumber}` : ''}</p>
                  </div>
                  <button onClick={() => unlinkMutation.mutate(mp.player.id)} className="text-slate-300 hover:text-red-500">
                    <Unlink size={14} />
                  </button>
                </div>
              ))}

              {/* Vincular nuevo */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500 mb-2">Vincular jugador existente:</p>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  onChange={e => { if (e.target.value) { linkMutation.mutate(e.target.value); e.target.value = ''; } }}
                  defaultValue=""
                >
                  <option value="">Seleccionar jugador...</option>
                  {players.filter((p: any) => !linkedIds.has(p.id)).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.fullName} — {p.team?.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Datos ── */}
          {tab === 'data' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Datos del socio</p>
              {[
                { label: 'Nombre', value: member?.fullName },
                { label: 'DNI', value: member?.dni },
                { label: 'Email', value: member?.email },
                { label: 'Teléfono', value: member?.phone ?? '—' },
                { label: 'Dirección', value: member?.address ?? '—' },
                { label: 'Usuario', value: `@${member?.username}` },
                { label: 'Estado', value: member?.active ? 'Activo' : 'Inactivo' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm text-slate-800">{value}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 pt-2">Para editar datos, usar el botón de edición en la tabla principal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MembersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkForm, setBulkForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: '', dueDate: '' });

  const { data, isLoading } = useQuery({ queryKey: ['members'], queryFn: () => api.members.list() });
  const members = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.members.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setShowForm(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.members.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
  const bulkMutation = useMutation({
    mutationFn: (d: unknown) => api.members.subscriptions.bulk(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setShowBulk(false); },
  });

  return (
    <div className="p-6 space-y-5">
      {showForm && <MemberForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}
      {selectedId && <MemberPanel memberId={selectedId} onClose={() => setSelectedId(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Socios</h1>
            <p className="text-sm text-slate-500">{members.length} socios registrados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(v => !v)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
            <CreditCard size={15} /> Cuotas masivas
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Nuevo socio
          </button>
        </div>
      </div>

      {/* Cuotas masivas */}
      {showBulk && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">Generar cuota del mes para todos los socios activos</p>
          <div className="grid grid-cols-4 gap-3">
            <select className="border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white" value={bulkForm.month} onChange={e => setBulkForm(f => ({ ...f, month: +e.target.value }))}>
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input className="border border-blue-200 rounded-lg px-3 py-2 text-sm" type="number" placeholder="Año" value={bulkForm.year} onChange={e => setBulkForm(f => ({ ...f, year: +e.target.value }))} />
            <input className="border border-blue-200 rounded-lg px-3 py-2 text-sm" type="number" placeholder="Monto $" value={bulkForm.amount} onChange={e => setBulkForm(f => ({ ...f, amount: e.target.value }))} />
            <input className="border border-blue-200 rounded-lg px-3 py-2 text-sm" type="date" value={bulkForm.dueDate} onChange={e => setBulkForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowBulk(false)} className="text-sm text-slate-500">Cancelar</button>
            <button
              onClick={() => { if (!bulkForm.amount || !bulkForm.dueDate) return; bulkMutation.mutate({ month: bulkForm.month, year: bulkForm.year, amount: +bulkForm.amount, dueDate: bulkForm.dueDate }); }}
              disabled={bulkMutation.isPending}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm hover:bg-brand-blue-dark disabled:opacity-50"
            >
              {bulkMutation.isPending ? 'Generando...' : 'Generar cuotas'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay socios registrados</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Socio</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contacto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Hijos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Cuotas pend.</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedId(m.id)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {m.fullName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{m.fullName}</p>
                        <p className="text-xs text-slate-400">@{m.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p className="text-xs">{m.email}</p>
                    {m.phone && <p className="text-xs text-slate-400">{m.phone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {m.players?.slice(0, 3).map((mp: any) => (
                        <span key={mp.player.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mp.player.fullName.split(' ')[0]}</span>
                      ))}
                      {m.players?.length > 3 && <span className="text-xs text-slate-400">+{m.players.length - 3}</span>}
                      {m.players?.length === 0 && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {m.pendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        <Clock size={10} /> {m.pendingCount}
                      </span>
                    ) : (
                      <span className="text-xs text-green-600">✓ Al día</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelectedId(m.id)} className="p-1.5 text-slate-400 hover:text-brand-blue rounded">
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar socio?')) deleteMutation.mutate(m.id); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
