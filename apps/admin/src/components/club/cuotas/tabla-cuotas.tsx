'use client';

import { DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CuotaStatusBadge } from '@/components/club/cuota-status';
import { CuotaRowActions } from './acciones';

export function TablaCuotas({
  subs,
  isLoading,
  copiedId,
  mpAmountOpen,
  mpAmountValue,
  sendLinkPending,
  markPaidPending,
  onCopy,
  onOpenMpAmount,
  onMpAmountChange,
  onConfirmLink,
  onCancelLink,
  onWhatsapp,
  onMarkPaid,
  onRemove,
}: {
  subs: any[];
  isLoading: boolean;
  copiedId: string | null;
  mpAmountOpen: string | null;
  mpAmountValue: number;
  sendLinkPending: boolean;
  markPaidPending: boolean;
  onCopy: (sub: any) => void;
  onOpenMpAmount: (sub: any) => void;
  onMpAmountChange: (v: number) => void;
  onConfirmLink: (sub: any) => void;
  onCancelLink: () => void;
  onWhatsapp: (sub: any) => void;
  onMarkPaid: (sub: any) => void;
  onRemove: (sub: any) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (subs.length === 0) {
    return (
      <div className="space-y-3 p-12 text-center">
        <DollarSign size={40} className="mx-auto text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">No hay cuotas generadas</p>
        <p className="text-sm text-muted-foreground/70">
          Usá "Generar cuotas masivas" para crear las cuotas del mes de un golpe
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Jugador</TableHead>
          <TableHead>Categoría / Profe</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Recargo</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Vence</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {subs.map((sub: any) => {
          const p = sub.player;
          return (
            <TableRow key={sub.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy/10">
                      <span className="text-xs font-bold text-brand-navy">
                        {p.fullName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    {p.firstName && p.lastName ? (
                      <>
                        <span className="font-semibold">{p.lastName}</span>
                        <span className="text-muted-foreground">, {p.firstName}</span>
                      </>
                    ) : (
                      <span className="font-semibold">{p.fullName}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {p.clubCategory ? (
                  <div>
                    <p className="text-xs font-medium">{p.clubCategory.name}</p>
                    {p.clubCategory.coach && (
                      <p className="text-xs text-muted-foreground">
                        Prof. {p.clubCategory.coach}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </TableCell>
              <TableCell className="font-bold">${sub.amount.toLocaleString('es-AR')}</TableCell>
              <TableCell className="text-xs">
                {sub.lateFee > 0 ? (
                  <span className="font-medium text-amber-600">
                    +${sub.lateFee.toLocaleString('es-AR')}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </TableCell>
              <TableCell className="font-bold">
                ${(sub.totalAmount ?? sub.amount).toLocaleString('es-AR')}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(sub.dueDate).toLocaleDateString('es-AR')}
              </TableCell>
              <TableCell>
                <CuotaStatusBadge status={sub.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <CuotaRowActions
                    sub={sub}
                    mpAmountOpen={mpAmountOpen === sub.id}
                    mpAmountValue={mpAmountValue}
                    sendLinkPending={sendLinkPending}
                    markPaidPending={markPaidPending}
                    onOpenMpAmount={() => onOpenMpAmount(sub)}
                    onMpAmountChange={onMpAmountChange}
                    onConfirmLink={() => onConfirmLink(sub)}
                    onCancelLink={onCancelLink}
                    onCopy={() => onCopy(sub)}
                    onWhatsapp={() => onWhatsapp(sub)}
                    onMarkPaid={() => onMarkPaid(sub)}
                    onRemove={() => onRemove(sub)}
                  />
                  {copiedId === sub.id && (
                    <span className="text-xs font-medium text-green-600">¡Copiado!</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
