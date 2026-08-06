'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Users,
  Plus,
  X,
  Edit2,
  Trash2,
  Unlink,
  CreditCard,
  CheckCircle,
  Clock,
  Send,
  Copy,
  MessageCircle,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { CuotaStatusBadge } from '@/components/club/cuota-status';

const MONTHS_FULL = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

// ── Formulario de creación / edición ──────────────────────────────────────────
function MemberForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? '',
    dni: initial?.dni ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    username: initial?.username ?? '',
    password: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!initial;
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Socio' : 'Nuevo Socio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>DNI *</Label>
              <Input value={form.dni} onChange={(e) => set('dni', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Usuario *</Label>
              <Input value={form.username} onChange={(e) => set('username', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{isEdit ? 'Nueva contraseña (dejar vacío)' : 'Contraseña *'}</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!form.fullName || !form.dni || !form.email || !form.username) return;
              const payload: any = { ...form };
              if (isEdit && !payload.password) delete payload.password;
              onSave(payload);
            }}
          >
            {isEdit ? 'Guardar cambios' : 'Crear socio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Panel lateral del socio ───────────────────────────────────────────────────
function MemberPanel({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    childAmount: '',
    dueDate: '',
  });
  const [generarLinkMp, setGenerarLinkMp] = useState(false);
  const [mpAmountOpen, setMpAmountOpen] = useState<string | null>(null);
  const [mpAmountValue, setMpAmountValue] = useState<number>(0);
  const [linkPlayer, setLinkPlayer] = useState('none');

  const { data, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => api.members.get(memberId),
  });
  const { data: allPlayers } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => api.players.list({ limit: '200' }),
  });
  const member = data?.data;
  const players = allPlayers?.data ?? [];
  const linkedIds = new Set(member?.players?.map((mp: any) => mp.player.id) ?? []);

  const linkMutation = useMutation({
    mutationFn: (playerId: string) => api.members.linkPlayer(memberId, playerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }),
    onError: (err: any) => toast.error(err.message),
  });
  const unlinkMutation = useMutation({
    mutationFn: (playerId: string) => api.members.unlinkPlayer(memberId, playerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member', memberId] }),
    onError: (err: any) => toast.error(err.message),
  });
  const createSubMutation = useMutation({
    mutationFn: async (d: any) => {
      const res = await api.members.subscriptions.create(memberId, d);
      const sub = res.data ?? res;
      if (generarLinkMp) {
        await api.members.subscriptions.sendLink(sub.id);
      }
      return sub;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', memberId] });
      setShowSubForm(false);
      toast.success('Cuota creada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const sendLinkMutation = useMutation({
    mutationFn: ({ subId, amount }: { subId: string; amount?: number }) =>
      api.members.subscriptions.sendLink(subId, amount !== undefined ? { amount } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', memberId] });
      setMpAmountOpen(null);
      toast.success('Link de pago generado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const markPaidMutation = useMutation({
    mutationFn: (subId: string) => api.members.subscriptions.markPaid(subId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', memberId] });
      toast.success('Cuota marcada como pagada');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteSubMutation = useMutation({
    mutationFn: (subId: string) => api.members.subscriptions.remove(subId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', memberId] });
      toast.success('Cuota eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  const whatsappLink = (phone: string, link: string, name: string, month: number, year: number) => {
    const msg = encodeURIComponent(`Hola ${name}! 👋 Te enviamos el link para pagar la cuota de ${MONTHS_FULL[month - 1]} ${year}: ${link}`);
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`;
  };

  if (isLoading) return null;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        {/* Header */}
        <SheetHeader className="mb-4 flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy font-bold text-white">
            {member?.fullName?.[0]}
          </div>
          <div className="flex-1">
            <SheetTitle className="text-base">{member?.fullName}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {member?.email} · @{member?.username}
            </p>
          </div>
        </SheetHeader>

        <Tabs defaultValue="subs">
          <TabsList className="w-full">
            <TabsTrigger value="subs" className="flex-1">
              Cuotas
            </TabsTrigger>
            <TabsTrigger value="players" className="flex-1">
              Hijos
            </TabsTrigger>
            <TabsTrigger value="data" className="flex-1">
              Datos
            </TabsTrigger>
          </TabsList>

          {/* ── Cuotas ── */}
          <TabsContent value="subs" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Historial de cuotas</p>
              <Button variant="link" size="sm" className="gap-1 text-xs" onClick={() => setShowSubForm((v) => !v)}>
                <Plus size={13} /> Agregar cuota
              </Button>
            </div>

            {showSubForm && (
              <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(subForm.month)}
                    onValueChange={(v) => setSubForm((f) => ({ ...f, month: +v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS_FULL.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Año"
                    value={subForm.year}
                    onChange={(e) => setSubForm((f) => ({ ...f, year: +e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Monto socio $"
                    value={subForm.amount}
                    onChange={(e) => setSubForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="Vencimiento"
                    value={subForm.dueDate}
                    onChange={(e) => setSubForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Monto hijo (opcional)"
                    value={subForm.childAmount}
                    onChange={(e) => setSubForm((f) => ({ ...f, childAmount: e.target.value }))}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={generarLinkMp}
                    onChange={(e) => setGenerarLinkMp(e.target.checked)}
                    className="rounded border-input text-brand-red focus:ring-brand-red"
                  />
                  Generar link de pago MP
                </label>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowSubForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!subForm.amount || !subForm.dueDate) return;
                      createSubMutation.mutate({
                        month: subForm.month,
                        year: subForm.year,
                        amount: +subForm.amount,
                        childAmount: subForm.childAmount ? +subForm.childAmount : undefined,
                        dueDate: subForm.dueDate,
                      });
                    }}
                    disabled={createSubMutation.isPending}
                  >
                    Crear
                  </Button>
                </div>
              </div>
            )}

            {member?.subscriptions?.length === 0 &&
            (!member?.players?.length || !member.players.some((mp: any) => mp.player.subscriptions?.length)) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin cuotas registradas</p>
            ) : (
              <>
                {member?.subscriptions?.map((sub: any) => (
                  <div key={sub.id} className="space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {MONTHS_FULL[sub.month - 1]} {sub.year}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${sub.amount.toLocaleString('es-AR')} · vence{' '}
                          {new Date(sub.dueDate).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CuotaStatusBadge status={sub.status} />
                        <ConfirmDialog
                          title="Eliminar cuota"
                          description="¿Eliminar esta cuota? Esta acción no se puede deshacer."
                          confirmLabel="Eliminar"
                          destructive
                          onConfirm={() => deleteSubMutation.mutate(sub.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label="Eliminar cuota">
                              <Trash2 size={13} />
                            </Button>
                          }
                        />
                      </div>
                    </div>

                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={11} /> Cuota del socio
                    </span>

                    {sub.mpPaymentLink && (
                      <div className="space-y-2 rounded-lg bg-muted p-3">
                        <p className="truncate text-xs text-muted-foreground">{sub.mpPaymentLink}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => copyLink(sub.mpPaymentLink, sub.id)}
                          >
                            <Copy size={11} /> {copied === sub.id ? '¡Copiado!' : 'Copiar link'}
                          </Button>
                          {member.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs text-green-700 hover:text-green-800"
                              asChild
                            >
                              <a
                                href={whatsappLink(member.phone, sub.mpPaymentLink, member.fullName, sub.month, sub.year)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle size={11} /> WhatsApp
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {sub.status !== 'PAID' && (
                      <div className="flex gap-2">
                        {mpAmountOpen === sub.id ? (
                          <div className="flex flex-1 items-center gap-1">
                            <Input
                              type="number"
                              value={mpAmountValue}
                              onChange={(e) => setMpAmountValue(+e.target.value)}
                              className="text-center text-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="bg-blue-600 text-xs hover:bg-blue-700"
                              onClick={() => sendLinkMutation.mutate({ subId: sub.id, amount: mpAmountValue })}
                              disabled={sendLinkMutation.isPending}
                            >
                              OK
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setMpAmountOpen(null)}>
                              X
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="flex-1 gap-1.5 text-xs text-brand-blue"
                            onClick={() => {
                              setMpAmountOpen(sub.id);
                              setMpAmountValue(sub.amount);
                            }}
                          >
                            <Send size={12} /> {sub.mpPaymentLink ? 'Regenerar link MP' : 'Generar link MP'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-green-100 text-xs text-green-700 hover:bg-green-200"
                          onClick={() => markPaidMutation.mutate(sub.id)}
                        >
                          <CheckCircle size={12} /> Marcar pagado
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Cuotas de hijos vinculados */}
                {member?.players?.map((mp: any) =>
                  mp.player.subscriptions?.map((childSub: any) => (
                    <div key={childSub.id} className="space-y-2 rounded-xl border border-amber-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {MONTHS_FULL[childSub.month - 1]} {childSub.year}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${childSub.amount.toLocaleString('es-AR')} · vence{' '}
                            {new Date(childSub.dueDate).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <CuotaStatusBadge status={childSub.status} />
                      </div>
                      <p className="flex items-center gap-1 text-xs text-amber-600">
                        <Users size={11} /> Cuota de {mp.player.fullName}
                      </p>
                    </div>
                  ))
                )}
              </>
            )}
          </TabsContent>

          {/* ── Hijos ── */}
          <TabsContent value="players" className="space-y-3">
            <p className="text-sm font-semibold">Jugadores vinculados</p>
            {member?.players?.map((mp: any) => (
              <div key={mp.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
                  {mp.player.fullName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{mp.player.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {mp.player.team?.category?.name} · {mp.player.team?.name}
                    {mp.player.shirtNumber ? ` · #${mp.player.shirtNumber}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => unlinkMutation.mutate(mp.player.id)} aria-label="Desvincular jugador">
                  <Unlink size={14} />
                </Button>
              </div>
            ))}

            {/* Vincular nuevo */}
            <div className="border-t pt-3">
              <p className="mb-2 text-xs text-muted-foreground">Vincular jugador existente:</p>
              <Select
                value={linkPlayer}
                onValueChange={(v) => {
                  if (v !== 'none') {
                    linkMutation.mutate(v);
                    setLinkPlayer('none');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar jugador..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar jugador...</SelectItem>
                  {players
                    .filter((p: any) => !linkedIds.has(p.id))
                    .map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName} — {p.team?.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ── Datos ── */}
          <TabsContent value="data" className="space-y-3">
            <p className="text-sm font-semibold">Datos del socio</p>
            {[
              { label: 'Nombre', value: member?.fullName },
              { label: 'DNI', value: member?.dni },
              { label: 'Email', value: member?.email },
              { label: 'Teléfono', value: member?.phone ?? '—' },
              { label: 'Dirección', value: member?.address ?? '—' },
              { label: 'Usuario', value: `@${member?.username}` },
              { label: 'Estado', value: member?.active ? 'Activo' : 'Inactivo' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-b py-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm">{value}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Para editar datos, usar el botón de edición en la tabla principal.
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MembersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    childAmount: '',
    dueDate: '',
  });
  const [bulkSendWa, setBulkSendWa] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.members.list(),
  });
  const members = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.members.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      setShowForm(false);
      toast.success('Socio creado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.members.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Socio eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.members.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      setEditingMember(null);
      toast.success('Socio actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const handleBulkGenerate = async () => {
    if (!bulkForm.amount || !bulkForm.dueDate) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await api.members.subscriptions.bulk({
        month: bulkForm.month,
        year: bulkForm.year,
        amount: +bulkForm.amount,
        childAmount: bulkForm.childAmount ? +bulkForm.childAmount : undefined,
        dueDate: bulkForm.dueDate,
        sendWhatsapp: bulkSendWa,
      });
      setBulkResult(res.data ?? res);
      toast.success('Cuotas generadas');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const openBulkWa = (waUrl: string) => {
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-5">
      {showForm && <MemberForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}
      {editingMember && <MemberForm initial={editingMember} onSave={(d) => updateMutation.mutate({ id: editingMember.id, data: d })} onCancel={() => setEditingMember(null)} />}
      {selectedId && <MemberPanel memberId={selectedId} onClose={() => setSelectedId(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-brand-red" size={24} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Socios</h1>
            <p className="text-sm text-muted-foreground">{members.length} socios registrados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowBulk((v) => !v)}>
            <CreditCard size={15} /> Cuotas masivas
          </Button>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Nuevo socio
          </Button>
        </div>
      </div>

      {/* Cuotas masivas */}
      {showBulk && !bulkResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm font-semibold text-blue-800">
              Generar cuota del mes para todos los socios activos
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Select
                value={String(bulkForm.month)}
                onValueChange={(v) => setBulkForm((f) => ({ ...f, month: +v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_FULL.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Año"
                value={bulkForm.year}
                onChange={(e) => setBulkForm((f) => ({ ...f, year: +e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Monto socio $"
                value={bulkForm.amount}
                onChange={(e) => setBulkForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <Input
                type="date"
                value={bulkForm.dueDate}
                onChange={(e) => setBulkForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="flex-1"
                type="number"
                placeholder="Monto hijo (opcional, si tiene jugadores vinculados)"
                value={bulkForm.childAmount}
                onChange={(e) => setBulkForm((f) => ({ ...f, childAmount: e.target.value }))}
              />
              <span className="text-xs text-blue-600">
                Si se completa, también genera cuota para los hijos vinculados
              </span>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-blue-700">
              <input
                type="checkbox"
                checked={bulkSendWa}
                onChange={(e) => setBulkSendWa(e.target.checked)}
                className="rounded border-blue-300 text-brand-red focus:ring-brand-red"
              />
              Generar link MP y enviar WhatsApp automáticamente
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowBulk(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBulkGenerate} disabled={bulkLoading}>
                {bulkLoading ? 'Generando...' : 'Generar cuotas'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado cuotas masivas */}
      {bulkResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-green-800">Cuotas generadas</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600"
                onClick={() => {
                  setBulkResult(null);
                  setShowBulk(false);
                  qc.invalidateQueries({ queryKey: ['members'] });
                }}
                aria-label="Cerrar resultado de generación"
              >
                <X size={18} />
              </Button>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="font-bold text-green-700">
                {bulkResult.created}/{bulkResult.total} socios
              </span>
              {bulkResult.skipped ? <span className="text-amber-600">({bulkResult.skipped} ya existían)</span> : null}
              {bulkResult.childrenCreated > 0 && (
                <span className="text-green-600">+ {bulkResult.childrenCreated} hijos</span>
              )}
            </div>

            {bulkResult.waMessages?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">
                  {bulkResult.waMessages.length} WhatsApp listos
                </p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {bulkResult.waMessages.map((w: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-green-100 bg-white p-2.5">
                      <span className="text-sm">{w.name}</span>
                      <Button
                        size="sm"
                        className="bg-green-500 text-xs hover:bg-green-600"
                        onClick={() => openBulkWa(w.waUrl)}
                        title="Se abre WhatsApp con el mensaje listo. Presioná Enter para enviar."
                      >
                        WhatsApp
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => bulkResult.waMessages.forEach((w: any) => openBulkWa(w.waUrl))}
                >
                  Enviar todos los WhatsApp ({bulkResult.waMessages.length})
                </Button>
                <p className="text-xs text-muted-foreground">
                  Se abre WhatsApp con el mensaje listo. Presioná <strong>Enter</strong> para enviar cada uno.
                </p>
              </div>
            )}

            {(!bulkResult.waMessages || bulkResult.waMessages.length === 0) && bulkSendWa && (
              <p className="text-xs text-amber-600">
                No se generaron WhatsApp. Revisá que los socios tengan teléfono y que MercadoPago esté
                configurado. Ver la consola del servidor para más detalles.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay socios registrados</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Hijos</TableHead>
                <TableHead>Cuotas pend.</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: any) => (
                <TableRow key={m.id} className="cursor-pointer" onClick={() => setSelectedId(m.id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
                        {m.fullName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{m.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{m.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{m.email}</p>
                    {m.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.players?.slice(0, 3).map((mp: any) => (
                        <Badge key={mp.player.id} variant="secondary" className="rounded-full text-xs font-normal">
                          {mp.player.fullName.split(' ')[0]}
                        </Badge>
                      ))}
                      {m.players?.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{m.players.length - 3}</span>
                      )}
                      {m.players?.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.pendingCount > 0 ? (
                      <Badge variant="warning" className="gap-1 rounded-full">
                        <Clock size={10} /> {m.pendingCount}
                      </Badge>
                    ) : (
                      <span className="text-xs text-green-600">✓ Al día</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-blue" onClick={() => setEditingMember(m)} title="Editar socio" aria-label="Editar socio">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-blue" onClick={() => setSelectedId(m.id)} aria-label="Ver detalle del socio">
                        <ChevronRight size={16} />
                      </Button>
                      <ConfirmDialog
                        title="Eliminar socio"
                        description={`¿Eliminar a ${m.fullName}? Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => deleteMutation.mutate(m.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Eliminar socio">
                            <Trash2 size={15} />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
