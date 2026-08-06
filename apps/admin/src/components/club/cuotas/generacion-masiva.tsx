'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Zap } from 'lucide-react';
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

type BulkResult = {
  created: number;
  total: number;
  skipped?: number;
  waMessages?: any[];
};

export function BulkModal({
  categories,
  onClose,
  onDone,
}: {
  categories: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const now = new Date();
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    amount: '',
    clubCategoryId: '',
  });
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!form.amount) {
      setError('El monto es requerido');
      return;
    }
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const payload: any = {
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
        clubCategoryId: form.clubCategoryId === 'none' ? undefined : form.clubCategoryId,
        sendWhatsapp,
      };
      const res = await api.players.subscriptions.bulk(payload);
      setResult(res.data ?? res);
    } catch (e: any) {
      setError(e.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = (waUrl: string) => {
    window.open(waUrl, '_blank');
  };

  if (result) {
    const waMsgs = result.waMessages ?? [];
    const waCount = waMsgs.length;
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={16} className="text-green-600" />
              Cuotas generadas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {result.created}/{result.total}
              </p>
              <p className="text-sm text-green-600">
                cuotas creadas
                {result.skipped ? (
                  <span className="ml-1 text-amber-600">
                    ({result.skipped} ya existían)
                  </span>
                ) : null}
              </p>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Vencimiento automático: día 10 de cada mes. Recargo del 10% después del
              vencimiento.
            </p>

            {waCount > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  {waCount} WhatsApp listos para enviar
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {waMsgs.map((w: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-muted p-3"
                    >
                      <div className="text-sm">
                        <p className="font-medium">{w.name ?? w.playerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.month} {w.year}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap text-green-700 hover:text-green-800"
                        onClick={() => openWhatsApp(w.waUrl)}
                        title="Se abre WhatsApp con el mensaje listo. Presioná Enter para enviar."
                      >
                        WhatsApp
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => waMsgs.forEach((w: any) => openWhatsApp(w.waUrl))}
                >
                  Enviar todos los WhatsApp ({waCount})
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Se abre WhatsApp con el mensaje listo. Presioná{' '}
                  <strong>Enter</strong> para enviar cada uno.
                </p>
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
          <DialogTitle className="flex items-center gap-2">
            <Zap size={16} className="text-brand-red" />
            Generar cuotas masivas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              Vence automáticamente el día 10. Recargo 10% después del vencimiento.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Categoría (opcional)</Label>
            <Select
              value={form.clubCategoryId}
              onValueChange={(v) => setForm((f) => ({ ...f, clubCategoryId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los jugadores activos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos los jugadores activos</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendWhatsapp}
              onChange={(e) => setSendWhatsapp(e.target.checked)}
              className="rounded border-input text-brand-red focus:ring-brand-red"
            />
            Generar link MP y enviar WhatsApp automáticamente
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleGenerate} disabled={saving}>
              {saving ? 'Generando...' : 'Generar Jugadores'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
