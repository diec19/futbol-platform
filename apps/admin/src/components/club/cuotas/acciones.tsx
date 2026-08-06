'use client';

import { Send, Copy, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

export function CuotaRowActions({
  sub,
  mpAmountOpen,
  mpAmountValue,
  sendLinkPending,
  markPaidPending,
  onOpenMpAmount,
  onMpAmountChange,
  onConfirmLink,
  onCancelLink,
  onCopy,
  onWhatsapp,
  onMarkPaid,
  onRemove,
}: {
  sub: any;
  mpAmountOpen: boolean;
  mpAmountValue: number;
  sendLinkPending: boolean;
  markPaidPending: boolean;
  onOpenMpAmount: () => void;
  onMpAmountChange: (v: number) => void;
  onConfirmLink: () => void;
  onCancelLink: () => void;
  onCopy: () => void;
  onWhatsapp: () => void;
  onMarkPaid: () => void;
  onRemove: () => void;
}) {
  if (sub.status === 'PAID') {
    return (
      <ConfirmDialog
        title="Eliminar cuota"
        description="¿Eliminar esta cuota? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={onRemove}
        trigger={
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
            <Trash2 size={14} />
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {mpAmountOpen ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={mpAmountValue}
            onChange={(e) => onMpAmountChange(+e.target.value)}
            className="w-20 px-1.5 py-1 text-center text-xs"
            autoFocus
          />
          <Button size="sm" className="bg-blue-600 px-2 text-xs hover:bg-blue-700" onClick={onConfirmLink} disabled={sendLinkPending}>
            OK
          </Button>
          <Button variant="ghost" size="sm" className="px-2 text-xs text-muted-foreground" onClick={onCancelLink}>
            X
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="whitespace-nowrap bg-blue-600 px-2.5 text-xs hover:bg-blue-700"
          onClick={onOpenMpAmount}
          title="Generar link MP"
        >
          <Send size={11} className="mr-1" />
          {sub.mpPaymentLink ? 'Reenviar' : 'Link MP'}
        </Button>
      )}

      {sub.mpPaymentLink && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onCopy}
          title="Copiar link"
        >
          <Copy size={13} />
        </Button>
      )}

      {sub.mpPaymentLink && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-xs font-bold text-green-600 hover:text-green-700"
          onClick={onWhatsapp}
          title="Enviar por WhatsApp"
        >
          WA
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-green-600"
        onClick={onMarkPaid}
        disabled={markPaidPending}
        title="Marcar pagada"
      >
        <CheckCircle size={14} />
      </Button>

      <ConfirmDialog
        title="Eliminar cuota"
        description="¿Eliminar esta cuota? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={onRemove}
        trigger={
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 size={14} />
          </Button>
        }
      />
    </div>
  );
}
