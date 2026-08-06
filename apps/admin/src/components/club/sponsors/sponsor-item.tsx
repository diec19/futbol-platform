'use client';

import { Handshake, Plus, Pencil, Trash2, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { SponsorStatusBadge } from './status';

export function SponsorItem({
  sponsor,
  isExpanded,
  plans,
  sponsorships,
  onToggle,
  onEdit,
  onToggleActive,
  onRemove,
  onAddPlan,
  onEditPlan,
  onRemovePlan,
  onNewSponsorship,
  onCancelSponsorship,
}: {
  sponsor: any;
  isExpanded: boolean;
  plans: any[];
  sponsorships: any[];
  onToggle: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
  onAddPlan: () => void;
  onEditPlan: (plan: any) => void;
  onRemovePlan: (plan: any) => void;
  onNewSponsorship: () => void;
  onCancelSponsorship: (sub: any) => void;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-5 hover:bg-muted/40"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {sponsor.logoUrl ? (
            <img src={sponsor.logoUrl} className="h-12 w-12 rounded-lg object-cover" alt="" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-red/10">
              <Handshake size={20} className="text-brand-red" />
            </div>
          )}
          <div>
            <h3 className="font-bold">{sponsor.name}</h3>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              {sponsor.contactName && <span>{sponsor.contactName}</span>}
              {sponsor.phone && <span>{sponsor.phone}</span>}
              {sponsor.email && <span>{sponsor.email}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <SponsorStatusBadge status={sponsor.active ? 'ACTIVE' : 'PAUSED'} />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Editar" aria-label="Editar auspiciante">
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
              onClick={onToggleActive}
              title={sponsor.active ? 'Pausar' : 'Activar'}
              aria-label={sponsor.active ? 'Pausar auspiciante' : 'Activar auspiciante'}
            >
              <Pause size={14} />
            </Button>
            <ConfirmDialog
              title="Eliminar auspiciante"
              description={`¿Eliminar "${sponsor.name}"? Esta acción no se puede deshacer.`}
              confirmLabel="Eliminar"
              destructive
              onConfirm={onRemove}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Eliminar auspiciante">
                  <Trash2 size={14} />
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="space-y-5 border-t bg-muted/30 p-5">
          {/* Plans */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Planes</h4>
              <Button size="sm" className="gap-1 bg-blue-600 text-xs hover:bg-blue-700" onClick={onAddPlan}>
                <Plus size={12} /> Agregar plan
              </Button>
            </div>
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin planes definidos</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {plans.map((plan: any) => (
                  <div key={plan.id} className="space-y-2 rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold">{plan.name}</h5>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => onEditPlan(plan)} aria-label="Editar plan">
                          <Pencil size={12} />
                        </Button>
                        <ConfirmDialog
                          title="Eliminar plan"
                          description={`¿Eliminar el plan "${plan.name}"?`}
                          confirmLabel="Eliminar"
                          destructive
                          onConfirm={() => onRemovePlan(plan)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label="Eliminar plan">
                              <Trash2 size={12} />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-brand-red">
                      ${plan.monthlyAmount.toLocaleString('es-AR')}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{plan.durationMonths} meses</p>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sponsorships */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Auspiciariones</h4>
              {plans.length > 0 && (
                <Button size="sm" className="gap-1 bg-green-600 text-xs hover:bg-green-700" onClick={onNewSponsorship}>
                  <Plus size={12} /> Nuevo auspiciarion
                </Button>
              )}
            </div>
            {sponsorships.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin auspiciariones activos</p>
            ) : (
              <div className="space-y-2">
                {sponsorships.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                    <div>
                      <p className="font-medium">
                        {sub.plan.name} — ${sub.plan.monthlyAmount.toLocaleString('es-AR')}/mes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.startDate).toLocaleDateString('es-AR')} —{' '}
                        {new Date(sub.endDate).toLocaleDateString('es-AR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.payments?.length ?? 0} cuotas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SponsorStatusBadge status={sub.status} />
                      {sub.status === 'ACTIVE' && (
                        <ConfirmDialog
                          title="Cancelar auspiciarion"
                          description="¿Cancelar este auspiciarion?"
                          confirmLabel="Cancelar"
                          destructive
                          onConfirm={() => onCancelSponsorship(sub)}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700">
                              Cancelar
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
