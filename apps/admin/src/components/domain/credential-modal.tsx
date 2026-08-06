'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function CredentialModal({ player, onClose }: { player: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['credential', player.id],
    queryFn: () => api.club.credentials.get(player.id),
  });
  const generateMutation = useMutation({
    mutationFn: () => api.club.credentials.generate(player.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credential', player.id] }),
  });

  const credential = data?.data?.credential;
  const teamOrCategory = player.team?.name ?? player.clubCategory?.name;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Credencial del Jugador</DialogTitle>
          <DialogDescription>{player.fullName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card preview */}
          <div className="rounded-xl bg-brand-navy p-4 text-white flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {player.fullName?.[0] ?? 'J'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base leading-tight truncate">{player.fullName}</p>
              <p className="text-white/70 text-xs">DNI: {player.dni}</p>
              {teamOrCategory && <p className="text-white/70 text-xs mt-0.5 truncate">{teamOrCategory}</p>}
              {player.shirtNumber && (
                <p className="text-brand-red text-xs font-bold mt-0.5">#{player.shirtNumber}</p>
              )}
            </div>
            {credential?.qrCode && (
              <img src={credential.qrCode} alt="QR" className="w-16 h-16 rounded bg-white p-1 flex-shrink-0" />
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : !credential ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">No tiene credencial generada aún</p>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? 'Generando...' : 'Generar credencial'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Válida hasta: {new Date(credential.expiresAt).toLocaleDateString('es-AR')}
              </p>
              <Button
                variant="outline"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? 'Generando...' : 'Regenerar QR'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = credential.qrCode;
                  a.download = `credencial-${player.fullName.replace(/ /g, '_')}.png`;
                  a.click();
                }}
                className="w-full"
              >
                <Download className="h-4 w-4" />
                Descargar QR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
