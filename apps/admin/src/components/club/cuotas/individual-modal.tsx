'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MONTHS } from './constants';

export function IndividualModal({
  players,
  onClose,
  onDone,
}: {
  players: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const now = new Date();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    amount: '',
  });
  const [generarLink, setGenerarLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ sub: any; paymentLink?: string } | null>(
    null
  );

  const filtered = players.filter(
    (p: any) => !search || p.fullName?.toLowerCase().includes(search.toLowerCase())
  );
  const selectedPlayer = players.find((p: any) => p.id === playerId);

  const handleCreate = async () => {
    if (!playerId || !form.amount) {
      setError('Completá todos los campos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.players.subscriptions.create(playerId, {
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
      });
      const sub = res.data ?? res;
      let paymentLink: string | undefined;
      if (generarLink) {
        const linkRes = await api.players.subscriptions.sendLink(sub.id);
        paymentLink = (linkRes.data as any)?.mpPaymentLink ?? '';
      }
      qc.invalidateQueries({ queryKey: ['player-subs'] });
      setResult({ sub, paymentLink });
    } catch (e: any) {
      setError(e.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsApp = () => {
    if (!result?.paymentLink) return;
    const monthName = MONTHS[Number(form.month) - 1];
    const msg = encodeURIComponent(
      `Hola! 👋 Te enviamos el link de pago de la cuota de ${monthName} ${form.year}: ${result.paymentLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (result) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-700">✓ Cuota creada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Cuota de <strong>{MONTHS[Number(form.month) - 1]} {form.year}</strong> —{' '}
              <strong>{selectedPlayer?.fullName}</strong>
            </p>
            {result.paymentLink && (
              <div className="space-y-2 rounded-xl bg-muted p-4">
                <p className="truncate text-xs text-muted-foreground">
                  {result.paymentLink}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(result.paymentLink!);
                    }}
                  >
                    Copiar link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-green-700 hover:text-green-800"
                    onClick={sendWhatsApp}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            )}
            <Button className="w-full" onClick={onDone}>
              Finalizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar cuota individual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Label className="mb-1.5 block">Jugador</Label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar jugador..."
            />
            {playerId && !showDropdown && (
              <p className="mt-1 text-xs text-green-600">{selectedPlayer?.fullName}</p>
            )}
            {showDropdown && filtered.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
                {filtered.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlayerId(p.id);
                      setSearch(p.fullName);
                      setShowDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                      p.id === playerId ? 'bg-primary/5 font-medium' : ''
                    }`}
                  >
                    {p.fullName}
                  </button>
                ))}
              </div>
            )}
            {showDropdown && search && filtered.length === 0 && (
              <p className="absolute z-10 mt-1 w-full rounded-lg border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
                Sin resultados
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select
                value={form.month}
                onValueChange={(v) => setForm((f) => ({ ...f, month: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monto ($)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="3500"
            />
            <p className="text-xs text-muted-foreground">
              Vence el día 10. Recargo 10% después del vencimiento.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={generarLink}
              onChange={(e) => setGenerarLink(e.target.checked)}
              className="rounded border-input text-brand-red focus:ring-brand-red"
            />
            Generar link de pago MP
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creando...' : 'Crear cuota'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
